document.getElementById('bookingForm').addEventListener('submit', async function (e) {
    e.preventDefault(); // Ngăn chặn reload trang

    // Lấy tên công ty và nhà xe từ select
    const companySelect = document.getElementById('company');
    const transporterSelect = document.getElementById('transporter');
    // Trim container code before using
    const rawContainerCode = document.getElementById('containerNo').value;
    const trimmedContainerCode = rawContainerCode.trim();
    const bookingData = {
        pickup_date: document.getElementById('pickupDate').value,
        company_name: companySelect.options[companySelect.selectedIndex].text,
        transporter_name: transporterSelect.options[transporterSelect.selectedIndex].text,
        booking_no: document.getElementById('bookingNo').value,
        container_code: trimmedContainerCode, // Đúng tên trường backend, đã trim
        seal: document.getElementById('seal').value,
        type: document.getElementById('type').value,
        quantity: document.getElementById('quantity').value,
        size: document.getElementById('size').value,
        pickup_location: document.getElementById('pickupLocation').value,
        dropoff_location: document.getElementById('dropoffLocation').value,
    };

    // Validate container code format after trim
    if (!/^[A-Z]{4}[0-9]{7}$/.test(trimmedContainerCode)) {
        showToast('Mã số Container phải gồm 4 chữ cái in hoa + 7 số (VD: ABCD1234567)');
        document.getElementById('containerNo').focus();
        e.preventDefault();
        return false;
    }

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
            // Lưu lại giá trị vừa chọn
            const pickupDateValue = document.getElementById('pickupDate').value;
            const companyValue = document.getElementById('company').value;
            const transporterValue = document.getElementById('transporter').value;
            document.getElementById('bookingForm').reset();
            // Gán lại giá trị vừa chọn
            document.getElementById('pickupDate').value = pickupDateValue;
            document.getElementById('company').value = companyValue;
            document.getElementById('transporter').value = transporterValue;
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
        <td>${bookingData.company_name || ''}</td>
        <td>${bookingData.transporter_name || ''}</td>
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
    if (!confirm('Bạn có chắc chắn muốn xóa booking này không?')) return;
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
    console.log('fetchBookings called');
    try {
        const response = await fetch('http://localhost:3000/bookings?page=1');
        if (!response.ok) throw new Error('Không thể lấy danh sách booking');
        const data = await response.json();
        const bookings = data.bookings || [];
        console.log('bookings:', bookings);
        const tableBody = document.querySelector('#bookingList tbody');
        tableBody.innerHTML = '';
        bookings.forEach(booking => {
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>${formatDate(booking.pickup_date) || ''}</td>
                <td>${booking.company_name || ''}</td>
                <td>${booking.transporter_name || ''}</td>
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

let bookingsData = [];
let currentPage = 1;
const BOOKINGS_PER_PAGE = 20;

function setBookingsData(data) {
    bookingsData = data;
    currentPage = 1;
    renderBookingList();
}

function renderBookingList() {
    const tableBody = document.querySelector('#bookingList tbody');
    tableBody.innerHTML = '';
    const startIdx = (currentPage - 1) * BOOKINGS_PER_PAGE;
    const endIdx = startIdx + BOOKINGS_PER_PAGE;
    const pageBookings = bookingsData.slice(startIdx, endIdx);
    pageBookings.forEach(booking => {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${formatDate(booking.pickup_date) || ''}</td>
            <td>${booking.company_name || ''}</td>
            <td>${booking.transporter_name || ''}</td>
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
    renderBookingPagination();
}

function renderBookingPagination() {
    let paginationContainer = document.getElementById('bookingPagination');
    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.id = 'bookingPagination';
        document.getElementById('bookingListContainer').appendChild(paginationContainer);
    }
    paginationContainer.innerHTML = '';
    const totalPages = Math.ceil(bookingsData.length / BOOKINGS_PER_PAGE);
    if (totalPages <= 1) return;
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.className = (i === currentPage) ? 'active' : '';
        btn.onclick = function() {
            currentPage = i;
            renderBookingList();
        };
        paginationContainer.appendChild(btn);
    }
}

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

document.addEventListener('DOMContentLoaded', function() {
    // Set pickupDate to today by default
    var today = new Date();
    var yyyy = today.getFullYear();
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var dd = String(today.getDate()).padStart(2, '0');
    var todayStr = yyyy + '-' + mm + '-' + dd;
    var pickupDateInput = document.getElementById('pickupDate');
    if (pickupDateInput) {
        pickupDateInput.value = todayStr;
    }
    // Load company and transporter select options
    loadCompaniesToSelect();
    loadTransportersToSelect();
    // Nút làm mới dữ liệu
    var refreshBtn = document.getElementById('refreshBookingBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            fetchBookings();
        });
    }
});