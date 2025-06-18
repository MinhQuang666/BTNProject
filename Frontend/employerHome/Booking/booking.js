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
        extra_fee: document.getElementById('extraFee').value || 0
    };

    // Lấy thêm dữ liệu từ form
    const invoiceCompany = document.getElementById('invoiceCompany').value.trim();
    const shippingLine = document.getElementById('shippingLine').value.trim();
    bookingData.invoice_company = invoiceCompany;
    bookingData.shipping_line = shippingLine;

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
            // Sau khi thêm thành công, luôn fetch lại danh sách booking từ backend
            fetchBookings();
            // Lưu lại giá trị vừa chọn
            const pickupDateValue = document.getElementById('pickupDate').value;
            const companyValue = document.getElementById('company').value;
            const transporterValue = document.getElementById('transporter').value;
            document.getElementById('bookingForm').reset();
            // Gán lại giá trị vừa chọn
            document.getElementById('pickupDate').value = pickupDateValue;
            document.getElementById('company').value = companyValue;
            document.getElementById('transporter').value = transporterValue;
            // Sau khi thêm, sửa, xóa booking thành công, gọi:
            localStorage.setItem('bookingListUpdated', Date.now().toString());
        } else {
            if (response.status === 409) {
                showToast('Booking đã tồn tại. Không thể thêm trùng lặp.', 'error');
            } else {
                const errorText = await response.text();
                showToast('Lỗi: ' + errorText, 'error');
            }
            // Không reset form nếu lỗi
        }
    } catch (err) {
        hideSpinner();
        showToast('Lỗi kết nối server!', 'error');
        console.error('Lỗi khi lưu booking:', err);
    }
});

function deleteBooking(button) {
    if (!confirm('Bạn có chắc chắn muốn xóa booking này không?')) return;
    const row = button.parentElement.parentElement;
    // Lấy id booking từ thuộc tính data-id hoặc từ dữ liệu đã fetch
    const bookingId = row.getAttribute('data-id');
    if (bookingId) {
        fetch(`http://localhost:3000/bookings/${encodeURIComponent(bookingId)}`, {
            method: 'DELETE',
        })
        .then(response => {
            if (response.ok) {
                showToast('Đã xóa booking!', 'success');
                fetchBookings();
                localStorage.setItem('bookingListUpdated', Date.now().toString());
            } else {
                response.text().then(text => showToast('Lỗi: ' + text, 'error'));
            }
        })
        .catch(err => {
            showToast('Lỗi kết nối server!', 'error');
            console.error('Lỗi khi xóa booking:', err);
        });
    } else {
        // Fallback: xóa theo nhiều trường như cũ (nếu chưa có id)
        const booking = {
            pickup_date: row.children[0].textContent,
            company_name: row.children[1].textContent,
            transporter_name: row.children[2].textContent,
            booking_no: row.children[3].textContent,
            container_code: row.children[4].textContent,
            seal: row.children[5].textContent,
            type: row.children[6].textContent === 'Nhập' ? 'import' : (row.children[6].textContent === 'Xuất' ? 'export' : row.children[6].textContent),
            quantity: row.children[7].textContent,
            size: row.children[8].textContent,
            pickup_location: row.children[9].textContent,
            dropoff_location: row.children[10].textContent,
            extra_fee: row.children[11].textContent
        };
        fetch('http://localhost:3000/bookings', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(booking)
        })
        .then(response => {
            if (response.ok) {
                showToast('Đã xóa booking!', 'success');
                fetchBookings();
                localStorage.setItem('bookingListUpdated', Date.now().toString());
            } else {
                response.text().then(text => showToast('Lỗi: ' + text, 'error'));
            }
        })
        .catch(err => {
            showToast('Lỗi kết nối server!', 'error');
            console.error('Lỗi khi xóa booking:', err);
        });
    }
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

// Lấy danh sách công ty và nhà xe cho filter select
async function loadFilterCompanies() {
    try {
        const response = await fetch('http://localhost:3000/companies?page=1');
        if (!response.ok) return;
        const data = await response.json();
        const companies = data.companies || [];
        const select = document.getElementById('filter-company_name');
        select.innerHTML = '<option value="">--Tất cả--</option>';
        companies.forEach(company => {
            const option = document.createElement('option');
            option.value = company.name;
            option.textContent = company.name;
            select.appendChild(option);
        });
    } catch (err) {}
}
async function loadFilterTransporters() {
    try {
        const response = await fetch('http://localhost:3000/transporters?page=1');
        if (!response.ok) return;
        const data = await response.json();
        const transporters = data.transporters || [];
        const select = document.getElementById('filter-transporter_name');
        select.innerHTML = '<option value="">--Tất cả--</option>';
        transporters.forEach(transporter => {
            const option = document.createElement('option');
            option.value = transporter.name;
            option.textContent = transporter.name;
            select.appendChild(option);
        });
    } catch (err) {}
}

// --- Company select search/lazy load ---
// XÓA: enableCompanySelectSearch, enableFilterCompanySelectSearch, searchCompanies, updateCompanySelectOptions, debounce và mọi đoạn code liên quan input .company-search-input

// Hàm fetchBookings: lấy danh sách booking từ backend và render ra bảng
async function fetchBookings() {
    console.log('fetchBookings called');
    try {
        const response = await fetch('http://localhost:3000/bookings?page=1');
        if (!response.ok) throw new Error('Không thể lấy danh sách booking');
        const data = await response.json();
        const bookings = data.bookings || [];
        console.log('bookings:', bookings);
        setBookingsData(bookings); // Chỉ set dữ liệu, không render trực tiếp
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
        newRow.setAttribute('data-id', booking.id); // Gán id SERIAL vào mỗi dòng
        newRow.innerHTML = `
            <td>${formatDate(booking.pickup_date) || ''}</td>
            <td>${booking.company_name || ''}</td>
            <td>${booking.transporter_name || ''}</td>
            <td>${booking.booking_no || ''}</td>
            <td>${booking.container_code || ''}</td>
            <td>${booking.seal || ''}</td>
            <td>${booking.type === 'import' ? 'Nhập' : booking.type === 'export' ? 'Xuất' : (booking.type || '')}</td>
            <td>${booking.quantity || ''}</td>
            <td>${booking.size || ''}</td>
            <td>${booking.pickup_location || ''}</td>
            <td>${booking.dropoff_location || ''}</td>
            <td>${booking.extra_fee || ''}</td>
            <td>${booking.invoice_company || ''}</td>
            <td>${booking.shipping_line || ''}</td>
            <td>
                <button class="send-to-detail-btn" data-id="${booking.id}">Chuyển sang tính phí</button>
                <button onclick="deleteBooking(this)">Xóa</button>
            </td>
        `;
        tableBody.appendChild(newRow);
        // Gán sự kiện cho nút chuyển sang tính phí
        const sendBtn = newRow.querySelector('.send-to-detail-btn');
        const bookingId = booking.id;
        sendBtn.textContent = `Chuyển sang tính phí`;
        sendBtn.title = `ID: ${bookingId}`;
        sendBtn.addEventListener('click', async function() {
            sendBtn.disabled = true;
            sendBtn.textContent = 'Đang chuyển...';
            try {
                const res = await fetch('http://localhost:3000/booking-details/from-booking', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: bookingId })
                });
                if (res.ok) {
                    sendBtn.textContent = 'Đã chuyển';
                    sendBtn.style.background = '#4CAF50';
                    sendBtn.style.color = '#fff';
                    sendBtn.disabled = true;
                    showToast('Đã chuyển sang tính phí!', 'success');
                } else {
                    const msg = await res.text();
                    sendBtn.textContent = `Chuyển sang tính phí`;
                    sendBtn.disabled = false;
                    showToast('Lỗi: ' + msg, 'error');
                }
            } catch (err) {
                sendBtn.textContent = `Chuyển sang tính phí `;
                sendBtn.disabled = false;
                showToast('Lỗi kết nối server!', 'error');
            }
        });
        // Thêm nút Update bên cạnh nút Chuyển sang tính phí
        const updateBtn = document.createElement('button');
        updateBtn.textContent = 'Cập nhật';
        updateBtn.className = 'update-booking-btn';
        updateBtn.style.marginRight = '6px';
        updateBtn.addEventListener('click', function() {
            showEditBookingModal(booking);
        });
        sendBtn.parentElement.insertBefore(updateBtn, sendBtn);
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

// Lọc dữ liệu bảng booking theo từng cột
const filterInputs = [
    'pickup_date', 'company_name', 'transporter_name', 'booking_no', 'container_code', 'seal', 'type', 'quantity', 'size', 'pickup_location', 'dropoff_location', 'extra_fee'
];
filterInputs.forEach(field => {
    const input = document.getElementById('filter-' + field);
    if (input) {
        input.addEventListener('input', filterBookingTable);
    }
});

function filterBookingTable() {
    const table = document.getElementById('bookingList');
    const tbody = table.querySelector('tbody');
    const rows = tbody.getElementsByTagName('tr');
    const filters = {};
    filterInputs.forEach(field => {
        const val = document.getElementById('filter-' + field).value.trim().toLowerCase();
        filters[field] = val;
    });
    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        let show = true;
        // Map thứ tự cột với filterInputs
        for (let j = 0; j < filterInputs.length; j++) {
            const filterVal = filters[filterInputs[j]];
            if (filterVal) {
                const cellText = (cells[j]?.textContent || '').toLowerCase();
                if (!cellText.includes(filterVal)) {
                    show = false;
                    break;
                }
            }
        }
        rows[i].style.display = show ? '' : 'none';
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
    // Nếu là dạng YYYY-MM-DD thì trả về luôn, không parse Date để tránh lệch múi giờ
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
    }
    // Nếu là ISO string hoặc dạng khác thì parse như cũ (không cộng thêm ngày)
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
    loadFilterCompanies();
    loadFilterTransporters();
    // Tải danh sách booking ngay khi vào trang
    fetchBookings();
    // Nút làm mới dữ liệu
    var refreshBtn = document.getElementById('refreshBookingBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            fetchBookings();
        });
    }
});

// Lắng nghe sự kiện cập nhật booking từ trang booking.html hoặc ContainerCharge.html
window.addEventListener('storage', function(event) {
    if (event.key === 'bookingListUpdated') {
        if (typeof fetchBookings === 'function') fetchBookings();
    }
});

// Popup cập nhật booking
function showEditBookingModal(booking) {
    let modal = document.getElementById('editBookingModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'editBookingModal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'rgba(0,0,0,0.3)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = 99999;
        modal.innerHTML = `
        <div style="background:#fff;padding:24px 20px 16px 20px;border-radius:10px;min-width:320px;max-width:95vw;max-height:90vh;overflow:auto;box-shadow:0 2px 16px rgba(0,0,0,0.18);">
            <h2 style="margin-top:0;font-size:1.1rem;">Cập nhật thông tin booking</h2>
            <form id="editBookingForm">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                    <label>Ngày lấy: <input type="date" name="pickup_date" value="${booking.pickup_date ? formatDate(booking.pickup_date) : ''}" required></label>
                    <label>Công ty: <input type="text" name="company_name" value="${booking.company_name||''}" required></label>
                    <label>Nhà xe: <input type="text" name="transporter_name" value="${booking.transporter_name||''}" required></label>
                    <label>BK No: <input type="text" name="booking_no" value="${booking.booking_no||''}" required></label>
                    <label>Mã Container: <input type="text" name="container_code" value="${booking.container_code||''}" required></label>
                    <label>Seal: <input type="text" name="seal" value="${booking.seal||''}" required></label>
                    <label>Số lượng: <input type="number" name="quantity" value="${booking.quantity||1}" required></label>
                    <label>Kích cỡ: <input type="text" name="size" value="${booking.size||''}" required></label>
                    <label>Nơi lấy: <input type="text" name="pickup_location" value="${booking.pickup_location||''}"></label>
                    <label>Nơi hạ: <input type="text" name="dropoff_location" value="${booking.dropoff_location||''}"></label>
                    <label>Loại hình:
  <select name="type" required>
    <option value="export" ${booking.type === 'export' ? 'selected' : ''}>Xuất</option>
    <option value="import" ${booking.type === 'import' ? 'selected' : ''}>Nhập</option>
  </select>
</label>
                    <label>Chi phí phụ: <input type="text" name="extra_fee" value="${booking.extra_fee||''}"></label>
                    <label>Công ty HĐ: <input type="text" name="invoice_company" value="${booking.invoice_company||''}"></label>
                    <label>Hãng tàu: <input type="text" name="shipping_line" value="${booking.shipping_line||''}"></label>
                </div>
                <div style="margin-top:16px;text-align:right;">
                    <button type="submit" class="btn btn-success">Lưu cập nhật</button>
                    <button type="button" id="cancelEditBookingBtn" class="btn btn-cancel" style="background:red;color:#fff;margin-left:8px;">Hủy</button>
                </div>
            </form>
        </div>`;
        document.body.appendChild(modal);
    }
    modal.style.display = 'flex';
    // Gán data-id cho form cập nhật booking bằng id SERIAL
    const editForm = modal.querySelector('#editBookingForm');
    if (editForm) {
        editForm.setAttribute('data-id', booking.id || '');
    }
    modal.querySelector('#cancelEditBookingBtn').onclick = function() {
        modal.style.display = 'none';
    };
    modal.querySelector('#editBookingForm').onsubmit = async function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const data = {};
        for (let [k, v] of formData.entries()) data[k] = v;
        // Validate mã container
        if (!/^[A-Z]{4}[0-9]{7}$/.test(data.container_code)) {
            showToast('Mã số Container phải gồm 4 chữ cái in hoa + 7 số (VD: ABCD1234567)', 'error');
            return;
        }
        // Gửi API cập nhật booking (PUT)
        try {
            // Lấy id booking từ data-id (đã gán khi mở form sửa)
            const bookingId = this.getAttribute('data-id');
            const url = bookingId ? `http://localhost:3000/bookings/${encodeURIComponent(bookingId)}` : `http://localhost:3000/bookings/${encodeURIComponent(data.booking_no)}`;
            const res = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                showToast('Đã cập nhật booking!', 'success');
                modal.style.display = 'none';
                fetchBookings();
            } else {
                const msg = await res.text();
                showToast('Lỗi: ' + msg, 'error');
            }
        } catch (err) {
            showToast('Lỗi kết nối server!', 'error');
        }
    };
}