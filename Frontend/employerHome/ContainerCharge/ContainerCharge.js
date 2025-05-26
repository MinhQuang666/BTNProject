document.addEventListener('DOMContentLoaded', function() {
    // Đặt ngày mặc định cho bộ lọc là ngày hiện tại
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    const filterDateInput = document.getElementById('filterDate');
    if (filterDateInput) filterDateInput.value = todayStr;

    // Lưu danh sách booking toàn bộ
    let allBookings = [];

    // Hàm fetch danh sách booking từ backend
    async function fetchBookings() {
        try {
            const response = await fetch('http://localhost:3000/bookings?page=1');
            if (!response.ok) throw new Error('Không thể lấy danh sách booking');
            const data = await response.json();
            // Nếu backend trả về { bookings: [...] }
            allBookings = data.bookings || data || [];
            renderBookingList();
        } catch (err) {
            console.error('Lỗi khi load danh sách booking:', err);
        }
    }

    // Hàm render danh sách booking ra bảng
    function renderBookingList() {
        const tableBody = document.querySelector('#bookingList tbody');
        tableBody.innerHTML = '';
        // Lấy filter từ các input
        const filters = {};
        filterInputs.forEach(field => {
            const input = document.getElementById('filter-' + field);
            filters[field] = input ? input.value.trim().toLowerCase() : '';
        });
        let bookingsToShow = allBookings.filter(booking => {
            // So sánh từng trường với filter, nếu có filter thì phải match
            return filterInputs.every((field, idx) => {
                const filterVal = filters[field];
                if (!filterVal) return true;
                let bookingVal = (booking[field] || '').toString().toLowerCase();
                // Đặc biệt cho loại hình: import/export => Nhập/Xuất
                if (field === 'type') {
                    if (bookingVal === 'import') bookingVal = 'nhập';
                    if (bookingVal === 'export') bookingVal = 'xuất';
                }
                return bookingVal.includes(filterVal);
            });
        });
        bookingsToShow.forEach(booking => {
            const newRow = document.createElement('tr');
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
            `;
            tableBody.appendChild(newRow);
        });
    }

    // Định dạng ngày yyyy-mm-dd
    function formatDate(dateString) {
        if (!dateString) return '';
        const d = new Date(dateString);
        if (isNaN(d)) return dateString;
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
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

    // Lọc dữ liệu bảng booking theo từng cột
    const filterInputs = [
        'pickup_date', 'company_name', 'transporter_name', 'booking_no', 'container_code', 'seal', 'type', 'quantity', 'size', 'pickup_location', 'dropoff_location', 'extra_fee'
    ];
    filterInputs.forEach(field => {
        const input = document.getElementById('filter-' + field);
        if (input) {
            input.addEventListener('input', filterBookingTable);
            if (input.tagName === 'SELECT') {
                input.addEventListener('change', filterBookingTable);
            }
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

    // Gọi khi trang load
    window.addEventListener('DOMContentLoaded', function() {
        loadFilterCompanies();
        loadFilterTransporters();
    });

    // Tải dữ liệu ban đầu
    fetchBookings();

    document.getElementById('refreshBookingBtn').addEventListener('click', function() {
        fetchBookings();
    });

    // Lắng nghe sự kiện cập nhật booking từ trang booking.html hoặc ContainerCharge.html
    window.addEventListener('storage', function(event) {
        if (event.key === 'bookingListUpdated') {
            if (typeof fetchBookings === 'function') fetchBookings();
        }
    });
});
