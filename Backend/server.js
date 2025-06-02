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

        // Nếu chưa có owner_code thì thêm mới với name=NULL
        if (ownerResult.rows.length === 0) {
            await pool.query('INSERT INTO container_owners (owner_code, name) VALUES ($1, NULL)', [owner_code]);
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
    const { new_container_code, size, owner_code } = req.body; // Thêm owner_code

    // Kiểm tra định dạng mã số container mới
    if (!isValidContainerCode(new_container_code)) {
        return res.status(400).send('Mã số container không hợp lệ. Định dạng phải là 4 chữ cái in hoa và 7 số.');
    }
    if (!owner_code || owner_code.length !== 3) {
        return res.status(400).send('Mã công ty sở hữu phải có đúng 3 ký tự.');
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
        // Kiểm tra owner_code có tồn tại không
        const ownerResult = await pool.query('SELECT * FROM container_owners WHERE owner_code = $1', [owner_code]);
        if (ownerResult.rows.length === 0) {
            return res.status(400).send('Mã công ty sở hữu không tồn tại.');
        }
        // Cập nhật mã số container, kích cỡ và owner_code
        const result = await pool.query(
            'UPDATE containers SET container_code = $1, size = $2, owner_code = $3 WHERE container_code = $4 RETURNING *',
            [new_container_code, size, owner_code, container_code]
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

// API cập nhật tên công ty sở hữu
app.put('/container-owners/:owner_code', async (req, res) => {
    const { owner_code } = req.params;
    const { name } = req.body;
    if (!name || name.trim() === '') {
        return res.status(400).send('Tên công ty là bắt buộc.');
    }
    try {
        const result = await pool.query(
            'UPDATE container_owners SET name = $1 WHERE owner_code = $2 RETURNING *',
            [name, owner_code]
        );
        if (result.rowCount === 0) {
            return res.status(404).send('Không tìm thấy mã công ty.');
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Error updating container owner:', err);
        res.status(500).send('Lỗi khi sửa tên công ty.');
    }
});

// ====== API CRUD cho companies ======
// Lấy danh sách companies (có phân trang hoặc tìm kiếm)
app.get('/companies', async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search ? req.query.search.trim() : '';
    try {
        let result, totalResult;
        if (search) {
            result = await pool.query(
                'SELECT * FROM companies WHERE name ILIKE $1 ORDER BY id LIMIT $2',
                [`%${search}%`, limit]
            );
            totalResult = await pool.query('SELECT COUNT(*) FROM companies WHERE name ILIKE $1', [`%${search}%`]);
        } else {
            result = await pool.query('SELECT * FROM companies ORDER BY id LIMIT $1 OFFSET $2', [limit, offset]);
            totalResult = await pool.query('SELECT COUNT(*) FROM companies');
        }
        const totalCompanies = parseInt(totalResult.rows[0].count, 10);
        res.json({
            companies: result.rows || [],
            totalCompanies,
            totalPages: Math.ceil(totalCompanies / limit),
            currentPage: page,
        });
    } catch (err) {
        console.error('Error fetching companies:', err);
        res.status(500).send('Lỗi khi lấy danh sách công ty.');
    }
});

// Thêm công ty mới
app.post('/companies', async (req, res) => {
    const { name } = req.body;
    if (!name || name.trim() === '') {
        return res.status(400).send('Tên công ty là bắt buộc.');
    }
    try {
        // Kiểm tra tên công ty đã tồn tại chưa
        const existing = await pool.query('SELECT * FROM companies WHERE name = $1', [name]);
        if (existing.rows.length > 0) {
            return res.status(409).send('Tên công ty đã tồn tại.');
        }
        const result = await pool.query('INSERT INTO companies (name) VALUES ($1) RETURNING *', [name]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error adding company:', err);
        res.status(500).send('Lỗi khi thêm công ty.');
    }
});

// Sửa thông tin công ty
app.put('/companies/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || name.trim() === '') {
        return res.status(400).send('Tên công ty là bắt buộc.');
    }
    try {
        const result = await pool.query('UPDATE companies SET name = $1 WHERE id = $2 RETURNING *', [name, id]);
        if (result.rowCount === 0) {
            return res.status(404).send('Không tìm thấy công ty.');
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Error updating company:', err);
        res.status(500).send('Lỗi khi sửa công ty.');
    }
});

// Xóa công ty
app.delete('/companies/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM companies WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).send('Không tìm thấy công ty.');
        }
        res.status(200).send('Công ty đã được xóa.');
    } catch (err) {
        console.error('Error deleting company:', err);
        res.status(500).send('Lỗi khi xóa công ty.');
    }
});

// ====== API CRUD cho bookings ======
// Lấy danh sách bookings (có phân trang, join container để lấy container_code và type)
app.get('/bookings', async (req, res) => {
    const { page = 1 } = req.query;
    const limit = 20;
    const offset = (page - 1) * limit;
    try {
        const result = await pool.query(`
            SELECT b.*, c.container_code
            FROM bookings b
            LEFT JOIN containers c ON b.container_code = c.container_code
            ORDER BY b.pickup_date DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset]);
        const totalResult = await pool.query('SELECT COUNT(*) FROM bookings');
        const totalBookings = parseInt(totalResult.rows[0].count, 10);
        res.json({
            bookings: result.rows || [],
            totalBookings,
            totalPages: Math.ceil(totalBookings / limit),
            currentPage: parseInt(page, 10),
        });
    } catch (err) {
        console.error('Error fetching bookings:', err);
        res.status(500).send('Lỗi khi lấy danh sách booking.');
    }
});

// Thêm booking mới
// Tự động đồng bộ bookings -> booking_details khi thêm mới booking
app.post('/bookings', async (req, res) => {
    let { booking_no, pickup_date, company_name, transporter_name, container_code, seal, quantity, size, pickup_location, dropoff_location, type, extra_fee, invoice_company, shipping_line } = req.body;
    if (container_code) container_code = container_code.trim();
    if (!booking_no || !pickup_date || !company_name || !transporter_name || !container_code || !seal || !quantity || !size) {
        return res.status(400).send('Thiếu thông tin bắt buộc.');
    }
    if (!isValidContainerCode(container_code)) {
        return res.status(400).send('Mã số Container không hợp lệ. Phải là 4 chữ cái in hoa + 7 số (VD: ABCD1234567)');
    }
    try {
        let containerResult = await pool.query('SELECT * FROM containers WHERE container_code = $1', [container_code]);
        if (containerResult.rows.length === 0) {
            const owner_code = container_code.substring(0, 3).toUpperCase();
            let ownerResult = await pool.query('SELECT * FROM container_owners WHERE owner_code = $1', [owner_code]);
            if (ownerResult.rows.length === 0) {
                await pool.query('INSERT INTO container_owners (owner_code, name) VALUES ($1, NULL)', [owner_code]);
            }
            await pool.query(
                'INSERT INTO containers (container_code, size, owner_code) VALUES ($1, $2, $3)',
                [container_code, size, owner_code]
            );
        }
        const existing = await pool.query(
            `SELECT * FROM bookings WHERE booking_no = $1 AND pickup_date = $2 AND company_name = $3 AND transporter_name = $4 AND container_code = $5 AND seal = $6 AND quantity = $7 AND size = $8 AND pickup_location = $9 AND dropoff_location = $10 AND type = $11 AND extra_fee = $12`,
            [booking_no, pickup_date, company_name, transporter_name, container_code, seal, quantity, size, pickup_location, dropoff_location, type, extra_fee]
        );
        if (existing.rows.length > 0) {
            return res.status(409).send('Booking đã tồn tại.');
        }
        const result = await pool.query(
            'INSERT INTO bookings (booking_no, pickup_date, company_name, transporter_name, container_code, seal, quantity, size, pickup_location, dropoff_location, type, extra_fee, invoice_company, shipping_line) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *',
            [booking_no, pickup_date, company_name, transporter_name, container_code, seal, quantity, size, pickup_location, dropoff_location, type, extra_fee, invoice_company, shipping_line]
        );
        // Tự động thêm vào booking_details nếu chưa có
        try {
            await pool.query(
                `INSERT INTO booking_details (booking_no, pickup_date, company_name, transporter_name, invoice_company, shipping_line, container_code, quantity, size, pickup_location, dropoff_location, type, extra_fee, charged)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, FALSE)
                ON CONFLICT DO NOTHING`,
                [booking_no, pickup_date, company_name, transporter_name, invoice_company, shipping_line, container_code, quantity, size, pickup_location, dropoff_location, type, extra_fee]
            );
        } catch (err) {
            console.error('Error syncing to booking_details:', err);
        }
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error adding booking:', err);
        res.status(500).send('Lỗi khi thêm booking.');
    }
});

// Sửa booking
app.put('/bookings/:booking_no', async (req, res) => {
    const { booking_no } = req.params;
    const { pickup_date, company_id, transporter_id, container_code, seal, quantity, size, pickup_location, dropoff_location } = req.body;
    try {
        const result = await pool.query(
            'UPDATE bookings SET pickup_date=$1, company_id=$2, transporter_id=$3, container_code=$4, seal=$5, quantity=$6, size=$7, pickup_location=$8, dropoff_location=$9 WHERE booking_no=$10 RETURNING *',
            [pickup_date, company_id, transporter_id, container_code, seal, quantity, size, pickup_location, dropoff_location, booking_no]
        );
        if (result.rowCount === 0) {
            return res.status(404).send('Không tìm thấy booking.');
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Error updating booking:', err);
        res.status(500).send('Lỗi khi sửa booking.');
    }
});

// Xóa booking (xác định duy nhất bằng nhiều trường)
app.delete('/bookings', async (req, res) => {
    const {
        booking_no,
        pickup_date,
        company_name,
        transporter_name,
        container_code,
        seal,
        type,
        quantity,
        size,
        pickup_location,
        dropoff_location,
        extra_fee
    } = req.body;
    if (!booking_no || !pickup_date || !company_name || !transporter_name || !container_code || !seal || !type) {
        return res.status(400).send('Thiếu thông tin định danh để xóa booking.');
    }
    try {
        const result = await pool.query(
            `DELETE FROM bookings WHERE booking_no = $1 AND pickup_date = $2 AND company_name = $3 AND transporter_name = $4 AND container_code = $5 AND seal = $6 AND type = $7 AND quantity = $8 AND size = $9 AND pickup_location = $10 AND dropoff_location = $11 AND extra_fee = $12`,
            [booking_no, pickup_date, company_name, transporter_name, container_code, seal, type, quantity, size, pickup_location, dropoff_location, extra_fee]
        );
        if (result.rowCount === 0) {
            return res.status(404).send('Không tìm thấy booking.');
        }
        res.status(200).send('Booking đã được xóa.');
    } catch (err) {
        console.error('Error deleting booking:', err);
        res.status(500).send('Lỗi khi xóa booking.');
    }
});

// API lấy danh sách booking_details (có phân trang, tìm kiếm)
app.get('/booking-details', async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search ? req.query.search.trim() : '';
    try {
        let result, totalResult;
        if (search) {
            result = await pool.query(
                `SELECT id, booking_no, pickup_date, company_name, transporter_name, invoice_company, shipping_line, container_code, quantity, size, pickup_location, dropoff_location, type, extra_fee, \
                receiving_price, delivery_price, lifting_fee, lowering_fee, \
                lifting_invoice, lifting_invoice_date, lifting_invoice_supplier, lowering_invoice, lowering_invoice_date, lowering_invoice_supplier, \
                thanh_ly, phu_thu, hoa_don, ngay_hd, cai_mep, phi_hun_trung, kiem_hoa, xin_so_cont, qua_tai, phi_van_chuyen, vat_8, ghi_chu, charged \
                FROM booking_details WHERE booking_no ILIKE $1 ORDER BY pickup_date DESC LIMIT $2 OFFSET $3`,
                [`%${search}%`, limit, offset]
            );
            totalResult = await pool.query('SELECT COUNT(*) FROM booking_details WHERE booking_no ILIKE $1', [`%${search}%`]);
        } else {
            result = await pool.query(
                `SELECT id, booking_no, pickup_date, company_name, transporter_name, invoice_company, shipping_line, container_code, quantity, size, pickup_location, dropoff_location, type, extra_fee, \
                receiving_price, delivery_price, lifting_fee, lowering_fee, \
                lifting_invoice, lifting_invoice_date, lifting_invoice_supplier, lowering_invoice, lowering_invoice_date, lowering_invoice_supplier, \
                thanh_ly, phu_thu, hoa_don, ngay_hd, cai_mep, phi_hun_trung, kiem_hoa, xin_so_cont, qua_tai, phi_van_chuyen, vat_8, ghi_chu, charged \
                FROM booking_details ORDER BY pickup_date DESC LIMIT $1 OFFSET $2`, [limit, offset]
            );
            totalResult = await pool.query('SELECT COUNT(*) FROM booking_details');
        }
        const total = parseInt(totalResult.rows[0].count, 10);
        res.json({
            bookingDetails: result.rows || [],
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
        });
    } catch (err) {
        console.error('Error fetching booking_details:', err);
        if (err.stack) console.error(err.stack);
        res.status(500).send('Lỗi khi lấy danh sách booking_details.');
    }
});

// API cập nhật thông tin bổ sung cho booking_details
app.put('/booking-details/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            receiving_price,
            delivery_price,
            lifting_fee,
            lifting_invoice,
            lifting_invoice_date,
            lifting_invoice_supplier,
            lowering_fee,
            lowering_invoice,
            lowering_invoice_date,
            lowering_invoice_supplier,
            thanh_ly,
            phu_thu,
            hoa_don,
            ngay_hd,
            cai_mep,
            phi_hun_trung,
            kiem_hoa,
            xin_so_cont,
            qua_tai,
            phi_van_chuyen,
            vat_8,
            ghi_chu,
            charged // <-- nhận từ frontend, true nếu submit tính phí
        } = req.body;
        // Debug log incoming data
        console.log('PUT /booking-details/:id', { id, body: req.body });
        // Sanitize numeric and date fields
        function toNumberOrNull(val) {
            if (val === undefined || val === null || val === '') return null;
            const n = Number(val);
            return isNaN(n) ? null : n;
        }
        function toDateOrNull(val) {
            if (!val || val === '') return null;
            return val;
        }
        // Chỉ cập nhật charged nếu có trường này trong body (frontend gửi khi submit tính phí)
        const sanitized = {
            receiving_price: toNumberOrNull(receiving_price),
            delivery_price: toNumberOrNull(delivery_price),
            lifting_fee: toNumberOrNull(lifting_fee),
            lifting_invoice,
            lifting_invoice_date: toDateOrNull(lifting_invoice_date),
            lifting_invoice_supplier,
            lowering_fee: toNumberOrNull(lowering_fee),
            lowering_invoice,
            lowering_invoice_date: toDateOrNull(lowering_invoice_date),
            lowering_invoice_supplier,
            thanh_ly,
            phu_thu: toNumberOrNull(phu_thu),
            hoa_don,
            ngay_hd: toDateOrNull(ngay_hd),
            cai_mep,
            phi_hun_trung: toNumberOrNull(phi_hun_trung),
            kiem_hoa: toNumberOrNull(kiem_hoa),
            xin_so_cont,
            qua_tai: toNumberOrNull(qua_tai),
            phi_van_chuyen: toNumberOrNull(phi_van_chuyen),
            vat_8: toNumberOrNull(vat_8),
            ghi_chu,
            charged: charged === true // chỉ true nếu submit tính phí
        };
        // Build dynamic SQL for charged
        const updateFields = [
            'receiving_price = $1',
            'delivery_price = $2',
            'lifting_fee = $3',
            'lifting_invoice = $4',
            'lifting_invoice_date = $5',
            'lifting_invoice_supplier = $6',
            'lowering_fee = $7',
            'lowering_invoice = $8',
            'lowering_invoice_date = $9',
            'lowering_invoice_supplier = $10',
            'thanh_ly = $11',
            'phu_thu = $12',
            'hoa_don = $13',
            'ngay_hd = $14',
            'cai_mep = $15',
            'phi_hun_trung = $16',
            'kiem_hoa = $17',
            'xin_so_cont = $18',
            'qua_tai = $19',
            'phi_van_chuyen = $20',
            'vat_8 = $21',
            'ghi_chu = $22',
            'charged = $23'
        ];
        const values = [
            sanitized.receiving_price,
            sanitized.delivery_price,
            sanitized.lifting_fee,
            sanitized.lifting_invoice,
            sanitized.lifting_invoice_date,
            sanitized.lifting_invoice_supplier,
            sanitized.lowering_fee,
            sanitized.lowering_invoice,
            sanitized.lowering_invoice_date,
            sanitized.lowering_invoice_supplier,
            sanitized.thanh_ly,
            sanitized.phu_thu,
            sanitized.hoa_don,
            sanitized.ngay_hd,
            sanitized.cai_mep,
            sanitized.phi_hun_trung,
            sanitized.kiem_hoa,
            sanitized.xin_so_cont,
            sanitized.qua_tai,
            sanitized.phi_van_chuyen,
            sanitized.vat_8,
            sanitized.ghi_chu,
            sanitized.charged,
            id
        ];
        const result = await pool.query(
            `UPDATE booking_details SET ${updateFields.join(', ')} WHERE id = $24 RETURNING *`,
            values
        );
        if (result.rowCount === 0) {
            return res.status(404).send('Không tìm thấy booking_details.');
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Error updating booking_details:', err);
        res.status(500).send('Lỗi khi cập nhật booking_details.');
    }
});

// API xóa booking_details theo id
app.delete('/booking-details/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM booking_details WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).send('Không tìm thấy booking_details.');
        }
        res.status(200).send('Booking details đã được xóa.');
    } catch (err) {
        console.error('Error deleting booking_details:', err);
        res.status(500).send('Lỗi khi xóa booking_details.');
    }
});

// API lấy danh sách transport_companies (dùng cho dropdown, không lỗi nếu không có bảng)
app.get('/transport_companies', async (req, res) => {
    try {
        // Nếu không có bảng, trả về mảng rỗng để frontend không lỗi
        res.json({ companies: [] });
    } catch (err) {
        res.json({ companies: [] });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});