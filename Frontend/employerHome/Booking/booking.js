document.getElementById('bookingForm').addEventListener('submit', function (e) {
    e.preventDefault(); // Ngăn chặn reload trang

    const bookingData = {
        pickupDate: document.getElementById('pickupDate').value,
        company: document.getElementById('company').value,
        transporter: document.getElementById('transporter').value,
        bookingNo: document.getElementById('bookingNo').value,
        containerNo: document.getElementById('containerNo').value,
        seal: document.getElementById('seal').value,
        type: document.getElementById('type').value,
        quantity: document.getElementById('quantity').value,
        size: document.getElementById('size').value,
        pickupLocation: document.getElementById('pickupLocation').value,
        dropoffLocation: document.getElementById('dropoffLocation').value,
    };

    addBookingToList(bookingData); // Thêm dữ liệu vào bảng danh sách
    hideBookingForm(); // Ẩn bảng nhập liệu
    document.getElementById('bookingForm').reset(); // Reset form
});

function addBookingToList(bookingData) {
    const tableBody = document.querySelector('#bookingList tbody');
    const newRow = document.createElement('tr');

    newRow.innerHTML = `
        <td>${bookingData.pickupDate}</td>
        <td>${bookingData.company}</td>
        <td>${bookingData.transporter}</td>
        <td>${bookingData.bookingNo}</td>
        <td>${bookingData.containerNo}</td>
        <td>${bookingData.seal}</td>
        <td>${bookingData.type}</td>
        <td>${bookingData.quantity}</td>
        <td>${bookingData.size}</td>
        <td>${bookingData.pickupLocation}</td>
        <td>${bookingData.dropoffLocation}</td>
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
<<<<<<< HEAD
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

document.addEventListener('DOMContentLoaded', function() {
    loadCompaniesToSelect();
    loadTransportersToSelect();
=======
>>>>>>> a5600f063d4a65bcf194a8c01345c4274462a3d9
});