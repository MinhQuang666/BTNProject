require('dotenv').config(); // Thêm dòng này ở đầu file

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors'); // Chỉ giữ lại một khai báo
const multer = require('multer');
const xlsx = require('xlsx');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');


const app = express();
const port = 3000;

// Cấu hình kết nối PostgreSQL
const pool = new Pool({
    user: 'postgres', // Thay bằng username của bạn
    host: 'localhost',
    database: 'CongTyVanTai', // Thay bằng tên database của bạn
    password: '1', // Thay bằng mật khẩu của bạn
    port: 5432,
});

pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error acquiring client', err.stack);
    }
    console.log('Connected to PostgreSQL');
    release();
});

// Middleware
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' }); // Lưu file tạm thời trong thư mục "uploads"

// Hàm kiểm tra định dạng mã số container
function isValidContainerCode(containerCode) {
    const regex = /^[A-Z]{4}[0-9]{7}$/;
    return regex.test(containerCode);
}

// API để lấy danh sách container với phân trang
app.get('/containers', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.container_code, c.size, o.owner_code, o.name AS owner_name
            FROM containers c
            JOIN container_owners o ON c.owner_code = o.owner_code
            ORDER BY c.id
        `);

        res.json(result.rows); // Trả về danh sách container
    } catch (err) {
        console.error('Error fetching containers:', err);
        res.status(500).send('Lỗi khi lấy danh sách container.');
    }
});

// API để thêm container
app.post('/containers', async (req, res) => {
    const { container_code, size } = req.body;

    if (!container_code || container_code.length !== 11) {
        return res.status(400).send('Mã số container không hợp lệ.');
    }

    // Lấy mã công ty sở hữu từ 3 ký tự đầu của mã container
    const owner_code = container_code.substring(0, 3);

    try {
        // Kiểm tra xem mã công ty sở hữu có tồn tại không
        const ownerResult = await pool.query('SELECT * FROM container_owners WHERE owner_code = $1', [owner_code]);

        if (ownerResult.rows.length === 0) {
            return res.status(404).send('Không tìm thấy công ty sở hữu với mã code này.');
        }

        // Thêm container mới vào cơ sở dữ liệu
        const containerResult = await pool.query(
            'INSERT INTO containers (container_code, size, owner_code) VALUES ($1, $2, $3) RETURNING *',
            [container_code, size, owner_code]
        );

        res.status(201).json(containerResult.rows[0]); // Trả về container vừa thêm
    } catch (err) {
        console.error('Error adding container:', err);
        res.status(500).send('Lỗi khi thêm container.');
    }
});

// API để xóa container
app.delete('/containers/:container_code', async (req, res) => {
    const { container_code } = req.params;
    try {
        const result = await pool.query('DELETE FROM containers WHERE container_code = $1', [container_code]);

        if (result.rowCount === 0) {
            return res.status(404).send('Không tìm thấy container.');
        }

        res.status(200).send('Container đã được xóa.');
    } catch (err) {
        console.error('Error deleting container:', err);
        res.status(500).send('Lỗi khi xóa container.');
    }
});

// API để sửa container
app.put('/containers/:container_code', async (req, res) => {
    const { container_code } = req.params; // Mã số container cũ
    const { new_container_code, size } = req.body; // Mã số container mới và kích cỡ mới

    // Kiểm tra định dạng mã số container mới
    if (!isValidContainerCode(new_container_code)) {
        return res.status(400).send('Mã số container không hợp lệ. Định dạng phải là 4 chữ cái in hoa và 7 số.');
    }

    try {
        // Nếu mã số container mới khác mã số cũ, kiểm tra xem mã số mới đã tồn tại chưa
        if (new_container_code !== container_code) {
            const checkResult = await pool.query(
                'SELECT * FROM containers WHERE container_code = $1',
                [new_container_code]
            );

            if (checkResult.rows.length > 0) {
                return res.status(400).send('Mã số container mới đã tồn tại.');
            }
        }

        // Cập nhật mã số container và kích cỡ
        const result = await pool.query(
            'UPDATE containers SET container_code = $1, size = $2 WHERE container_code = $3 RETURNING *',
            [new_container_code, size, container_code]
        );

        if (result.rowCount === 0) {
            return res.status(404).send('Không tìm thấy container.');
        }

        res.status(200).json(result.rows[0]); // Trả về container đã được cập nhật
    } catch (err) {
        console.error('Error updating container:', err);
        res.status(500).send('Lỗi khi sửa container.');
    }
});

// API để thêm nhiều container từ file Excel
app.post('/upload', upload.single('file'), async (req, res) => {
    const file = req.file;

    if (!file) {
        return res.status(400).send('Vui lòng tải lên file Excel.');
    }

    try {
        // Đọc file Excel
        const workbook = xlsx.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        // Lọc và thêm container vào cơ sở dữ liệu
        for (const row of data) {
            const container_code = row['SỐ CONTAINER'];
            const size = row['Size'];

            if (!isValidContainerCode(container_code)) {
                console.log(`Mã container không hợp lệ: ${container_code}`);
                continue;
            }

            // Kiểm tra xem container đã tồn tại chưa
            const checkResult = await pool.query(
                'SELECT * FROM container WHERE container_code = $1',
                [container_code]
            );

            if (checkResult.rows.length > 0) {
                console.log(`Container đã tồn tại: ${container_code}`);
                continue;
            }

            // Thêm container vào cơ sở dữ liệu
            await pool.query(
                'INSERT INTO container (container_code, size) VALUES ($1, $2)',
                [container_code, size]
            );
        }

        res.status(200).send('File đã được xử lý và container đã được thêm.');
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi khi xử lý file Excel.');
    }
});
app.use(cors());
app.use(bodyParser.json());

// API gửi email
app.post('/send-email', async (req, res) => {
    const { name, email, message } = req.body;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER, // Lấy email từ biến môi trường
            pass: process.env.EMAIL_PASS, // Lấy mật khẩu từ biến môi trường
        },
    });

    const mailOptions = {
        from: email,
        to: 'quangtrantroi@gmail.com', // Email nhận
        subject: `Liên hệ từ ${name}`,
        text: message,
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).send('Email đã được gửi thành công!');
    } catch (error) {
        console.error('Lỗi khi gửi email:', error);
        res.status(500).send('Đã xảy ra lỗi khi gửi email.');
    }
});

// API để thêm nhà xe
app.post('/transporters', async (req, res) => {
    const { id, name } = req.body;

    if (!id || id.trim() === '') {
        return res.status(400).send('ID nhà xe là bắt buộc.');
    }

    if (!name || name.trim() === '') {
        return res.status(400).send('Tên nhà xe là bắt buộc.');
    }

    try {
        // Kiểm tra xem ID hoặc tên nhà xe đã tồn tại hay chưa
        const existingTransporter = await pool.query('SELECT * FROM transporters WHERE id = $1 OR name = $2', [id, name]);

        if (existingTransporter.rows.length > 0) {
            return res.status(409).send('ID hoặc tên nhà xe đã tồn tại.');
        }

        // Thêm nhà xe mới
        const result = await pool.query(
            'INSERT INTO transporters (id, name) VALUES ($1, $2) RETURNING *',
            [id, name]
        );

        res.status(201).json(result.rows[0]); // Trả về nhà xe vừa thêm
    } catch (err) {
        console.error('Error adding transporter:', err);
        res.status(500).send('Lỗi khi thêm nhà xe.');
    }
});

// API để lấy danh sách nhà xe với phân trang
app.get('/transporters', async (req, res) => {
    const { page = 1 } = req.query; // Lấy tham số phân trang từ query
    const limit = 20; // Số lượng bản ghi mỗi trang
    const offset = (page - 1) * limit; // Tính toán offset

    try {
        // Lấy danh sách nhà xe từ cơ sở dữ liệu
        const result = await pool.query(
            'SELECT * FROM transporters ORDER BY id LIMIT $1 OFFSET $2',
            [limit, offset]
        );

        // Lấy tổng số nhà xe
        const totalResult = await pool.query('SELECT COUNT(*) FROM transporters');
        const totalTransporters = parseInt(totalResult.rows[0].count, 10);

        // Trả về dữ liệu dưới dạng JSON
        res.json({
            transporters: result.rows || [],
            totalTransporters,
            totalPages: Math.ceil(totalTransporters / limit),
            currentPage: parseInt(page, 10),
        });
    } catch (err) {
        console.error('Error fetching transporters:', err);
        res.status(500).send('Lỗi khi lấy danh sách nhà xe.');
    }
});

app.put('/transporters/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).send('Tên nhà xe là bắt buộc.');
    }

    try {
        const result = await pool.query(
            'UPDATE transporters SET name = $1 WHERE id = $2 RETURNING *',
            [name, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).send('Không tìm thấy nhà xe.');
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Error updating transporter:', err);
        res.status(500).send('Lỗi khi sửa nhà xe.');
    }
});

app.delete('/transporters/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM transporters WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).send('Không tìm thấy nhà xe.');
        }

        res.status(200).send('Nhà xe đã được xóa.');
    } catch (err) {
        console.error('Error deleting transporter:', err);
        res.status(500).send('Lỗi khi xóa nhà xe.');
    }
});

app.post('/locations', async (req, res) => {
    const { id, name, image_url } = req.body;

    if (!id || id.trim() === '') {
        return res.status(400).send('ID địa điểm là bắt buộc.');
    }

    if (!name || name.trim() === '') {
        return res.status(400).send('Tên địa điểm là bắt buộc.');
    }

    try {
        const result = await pool.query(
            'INSERT INTO locations (id, name, image_url) VALUES ($1, $2, $3) RETURNING *',
            [id, name, image_url]
        );

        res.status(201).json(result.rows[0]); // Trả về địa điểm vừa thêm
    } catch (err) {
        console.error('Error adding location:', err);
        res.status(500).send('Lỗi khi thêm địa điểm.');
    }
});

app.get('/locations', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM locations ORDER BY id');
        res.json({ locations: result.rows }); // Trả về danh sách địa điểm
    } catch (err) {
        console.error('Error fetching locations:', err);
        res.status(500).send('Lỗi khi lấy danh sách địa điểm.');
    }
});

app.delete('/locations/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM locations WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).send('Không tìm thấy địa điểm.');
        }

        res.status(200).send('Địa điểm đã được xóa.');
    } catch (err) {
        console.error('Error deleting location:', err);
        res.status(500).send('Lỗi khi xóa địa điểm.');
    }
});

app.put('/locations/:id', async (req, res) => {
    const { id } = req.params;
    const { name, image_url } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).send('Tên địa điểm là bắt buộc.');
    }

    try {
        const result = await pool.query(
            'UPDATE locations SET name = $1, image_url = $2 WHERE id = $3 RETURNING *',
            [name, image_url, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).send('Không tìm thấy địa điểm.');
        }

        res.status(200).json(result.rows[0]); // Trả về địa điểm đã được cập nhật
    } catch (err) {
        console.error('Error updating location:', err);
        res.status(500).send('Lỗi khi sửa địa điểm.');
    }
});

app.post('/container-owners', async (req, res) => {
    const { owner_code, name } = req.body;

    if (!owner_code || owner_code.length !== 3) {
        return res.status(400).send('Mã công ty phải có đúng 3 ký tự.');
    }

    if (!name) {
        return res.status(400).send('Tên công ty là bắt buộc.');
    }

    try {
        const result = await pool.query(
            'INSERT INTO container_owners (owner_code, name) VALUES ($1, $2) RETURNING *',
            [owner_code.toUpperCase(), name]
        );
        res.status(201).json(result.rows[0]); // Trả về dữ liệu vừa thêm
    } catch (err) {
        console.error('Error adding container owner:', err);
        res.status(500).send('Lỗi khi thêm mã công ty.');
    }
});

app.get('/container-owners', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM container_owners ORDER BY owner_code');
        res.json(result.rows); // Trả về danh sách mã công ty
    } catch (err) {
        console.error('Error fetching container owners:', err);
        res.status(500).send('Lỗi khi lấy danh sách mã công ty.');
    }
});

app.delete('/container-owners/:owner_code', async (req, res) => {
    const { owner_code } = req.params;

    try {
        const result = await pool.query('DELETE FROM container_owners WHERE owner_code = $1', [owner_code]);

        if (result.rowCount === 0) {
            return res.status(404).send('Không tìm thấy mã công ty.');
        }

        res.status(200).send('Mã công ty đã được xóa.');
    } catch (err) {
        console.error('Error deleting container owner:', err);
        res.status(500).send('Lỗi khi xóa mã công ty.');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});