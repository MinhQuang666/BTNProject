document.getElementById('bookingForm').addEventListener('submit', async function (e) {
    e.preventDefault(); // Ngăn chặn reload trang

    // Lấy dữ liệu từ form, dùng đúng tên trường backend yêu cầu
    const bookingData = {
        pickup_date: document.getElementById('pickupDate').value,
        company_id: document.getElementById('company').value,
        transporter_id: document.getElementById('transporter').value,
        booking_no: document.getElementById('bookingNo').value,
        container_code: document.getElementById('containerNo').value, // Đúng tên trường backend
        seal: document.getElementById('seal').value,
        type: document.getElementById('type').value,
        quantity: document.getElementById('quantity').value,
        size: document.getElementById('size').value,
        pickup_location: document.getElementById('pickupLocation').value,
        dropoff_location: document.getElementById('dropoffLocation').value,
    };

    // Gọi API backend để lưu booking
    try {
        showSpinner();
        const response = await fetch('http://localhost:3000/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        });
        hideSpinner();
        if (response.ok) {
            showToast('Lưu booking thành công!', 'success');
            addBookingToList(bookingData); // Thêm vào bảng giao diện
            hideBookingForm();
            document.getElementById('bookingForm').reset();
        } else {
            const errorText = await response.text();
            showToast('Lỗi: ' + errorText, 'error');
        }
    } catch (err) {
        hideSpinner();
        showToast('Lỗi kết nối server!', 'error');
        console.error('Lỗi khi lưu booking:', err);
    }
});

function addBookingToList(bookingData) {
    const tableBody = document.querySelector('#bookingList tbody');
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${formatDate(bookingData.pickup_date) || ''}</td>
        <td>${bookingData.company_id || ''}</td>
        <td>${bookingData.transporter_id || ''}</td>
        <td>${bookingData.booking_no || ''}</td>
        <td>${bookingData.container_code || ''}</td>
        <td>${bookingData.seal || ''}</td>
        <td>${bookingData.type || ''}</td>
        <td>${bookingData.quantity || ''}</td>
        <td>${bookingData.size || ''}</td>
        <td>${bookingData.pickup_location || ''}</td>
        <td>${bookingData.dropoff_location || ''}</td>
        <td>
            <button onclick="deleteBooking(this)">Xóa</button>
        </td>
    `;

    tableBody.appendChild(newRow);
}

function deleteBooking(button) {
    const row = button.parentElement.parentElement;
    row.remove(); // Xóa hàng khỏi bảng
}

function showBookingForm() {
    const bookingForm = document.getElementById('draggableContainer');
    bookingForm.style.display = 'block'; // Hiển thị bảng nhập liệu
}

function hideBookingForm() {
    const bookingForm = document.getElementById('draggableContainer');
    bookingForm.style.display = 'none'; // Ẩn bảng nhập liệu
}

const draggableContainer = document.getElementById('draggableContainer');

let isDragging = false;
let offsetX, offsetY;

// Bắt đầu kéo
draggableContainer.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - draggableContainer.offsetLeft;
    offsetY = e.clientY - draggableContainer.offsetTop;
    draggableContainer.style.cursor = 'grabbing'; // Thay đổi con trỏ chuột
});

// Kéo di chuyển
document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        let newX = e.clientX - offsetX;
        let newY = e.clientY - offsetY;

        // Giới hạn di chuyển trong trang web
        const containerRect = draggableContainer.getBoundingClientRect();
        const parentRect = document.body.getBoundingClientRect();

        if (newX < 0) newX = 0; // Không cho vượt bên trái
        if (newY < 0) newY = 0; // Không cho vượt bên trên
        if (newX + containerRect.width > parentRect.width) {
            newX = parentRect.width - containerRect.width; // Không cho vượt bên phải
        }
        if (newY + containerRect.height > parentRect.height) {
            newY = parentRect.height - containerRect.height; // Không cho vượt bên dưới
        }

        draggableContainer.style.left = `${newX}px`;
        draggableContainer.style.top = `${newY}px`;
    }
});

// Dừng kéo
document.addEventListener('mouseup', () => {
    isDragging = false;
    draggableContainer.style.cursor = 'move'; // Trả lại con trỏ chuột
});

// Tự động load danh sách công ty vào select khi trang booking load
async function loadCompaniesToSelect() {
    try {
        const response = await fetch('http://localhost:3000/companies?page=1');
        if (!response.ok) throw new Error('Không thể lấy danh sách công ty');
        const data = await response.json();
        const companies = data.companies || [];
        const select = document.getElementById('company');
        select.innerHTML = '<option value="">-- Chọn công ty --</option>';
        companies.forEach(company => {
            const option = document.createElement('option');
            option.value = company.id;
            option.textContent = company.name;
            select.appendChild(option);
        });
    } catch (err) {
        console.error('Lỗi khi load danh sách công ty:', err);
    }
}

// Tự động load danh sách nhà xe vào select khi trang booking load
async function loadTransportersToSelect() {
    try {
        const response = await fetch('http://localhost:3000/transporters?page=1');
        if (!response.ok) throw new Error('Không thể lấy danh sách nhà xe');
        const data = await response.json();
        const transporters = data.transporters || [];
        const select = document.getElementById('transporter');
        select.innerHTML = '<option value="">-- Chọn nhà xe --</option>';
        transporters.forEach(transporter => {
            const option = document.createElement('option');
            option.value = transporter.id;
            option.textContent = transporter.name;
            select.appendChild(option);
        });
    } catch (err) {
        console.error('Lỗi khi load danh sách nhà xe:', err);
    }
}

// Hàm fetchBookings: lấy danh sách booking từ backend và render ra bảng
async function fetchBookings() {
    try {
        const response = await fetch('http://localhost:3000/bookings?page=1');
        if (!response.ok) throw new Error('Không thể lấy danh sách booking');
        const data = await response.json();
        const bookings = data.bookings || [];
        const tableBody = document.querySelector('#bookingList tbody');
        tableBody.innerHTML = '';
        bookings.forEach(booking => {
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>${formatDate(booking.pickup_date) || ''}</td>
                <td>${booking.company_id || ''}</td>
                <td>${booking.transporter_id || ''}</td>
                <td>${booking.booking_no || ''}</td>
                <td>${booking.container_code || ''}</td>
                <td>${booking.seal || ''}</td>
                <td>${booking.type || ''}</td>
                <td>${booking.quantity || ''}</td>
                <td>${booking.size || ''}</td>
                <td>${booking.pickup_location || ''}</td>
                <td>${booking.dropoff_location || ''}</td>
                <td><button onclick="deleteBooking(this)">Xóa</button></td>
            `;
            tableBody.appendChild(newRow);
        });
    } catch (err) {
        console.error('Lỗi khi load danh sách booking:', err);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadCompaniesToSelect();
    loadTransportersToSelect();
    fetchBookings();
});

// Toast và spinner
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.background = type === 'success' ? '#28a745' : '#dc3545';
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 2500);
}
function showSpinner() {
    document.getElementById('spinner').style.display = 'block';
}
function hideSpinner() {
    document.getElementById('spinner').style.display = 'none';
}

function formatDate(dateString) {
    if (!dateString) return '';
    const d = new Date(dateString);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}