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

    // --- BỔ SUNG JS cho tính phí booking ---

    // Lưu lại bookings và booking_details
    let allBookingDetails = [];

    // Lấy danh sách booking_details từ backend
    async function fetchBookingDetails() {
        try {
            const response = await fetch('http://localhost:3000/booking-details?page=1');
            if (!response.ok) throw new Error('Không thể lấy danh sách booking_details');
            const data = await response.json();
            allBookingDetails = data.bookingDetails || [];
            renderBookingList();
        } catch (err) {
            console.error('Lỗi khi load booking_details:', err);
        }
    }

    // Lấy danh sách công ty nhà xe cho select
    async function loadTransportCompanies() {
        try {
            const response = await fetch('http://localhost:3000/transport_companies');
            if (!response.ok) return;
            const data = await response.json();
            const select = document.getElementById('transport_company_id');
            select.innerHTML = '<option value="">--Chọn công ty nhà xe--</option>';
            (data.companies || []).forEach(tc => {
                const option = document.createElement('option');
                option.value = tc.id;
                option.textContent = tc.name;
                select.appendChild(option);
            });
        } catch (err) {
            // Sửa lại loadTransportCompanies để dùng input text thay vì select nếu không có bảng
            function loadTransportCompanies() {
                const select = document.getElementById('transport_company_id');
                if (select) {
                    // Thay select thành input text nếu không có bảng
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.name = 'transport_companies';
                    input.id = 'transport_companies';
                    input.style.width = '100%';
                    input.placeholder = 'Nhập tên công ty nhà xe';
                    select.parentNode.replaceChild(input, select);
                }
            }
        }
    }

    // Sửa lại renderBookingList để hiển thị trạng thái và nút tính phí
    function renderBookingList() {
        const tableBody = document.querySelector('#bookingList tbody');
        tableBody.innerHTML = '';
        allBookingDetails.forEach(booking => {
            // Use transport_companies (manually entered) if present, else fallback to transporter_name
            const displayTransportCompany = booking.transport_companies || booking.transporter_name || '';
            // Đã tính phí nếu có bất kỳ trường phí nào đã nhập (ví dụ: receiving_price, delivery_price, lifting_fee, ...)
            const isCharged = !!(booking.receiving_price || booking.delivery_price || booking.lifting_fee || booking.lowering_fee || booking.hoa_don);
            const row = document.createElement('tr');
            row.className = isCharged ? 'charged-row' : 'waiting-charge';
            row.innerHTML = `
                <td>${formatDate(booking.pickup_date) || ''}</td>
                <td>${booking.company_name || ''}</td>
                <td>${displayTransportCompany}</td>
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
                <td style="text-align:center;">
                    <button class="detail-btn action-btn" data-id="${booking.id}">Chi tiết</button>
                    ${!isCharged ? '<button class="charge-btn action-btn" data-id="'+booking.id+'">Tính phí</button>' : '<span style="display:inline-block;min-width:90px;color:#4CAF50;font-weight:600;">Đã tính phí</span>'}
                    <button class="delete-detail-btn action-btn" data-id="${booking.id}" style="background:#dc3545;">Xoá</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        // Gán sự kiện cho nút Tính phí
        document.querySelectorAll('.charge-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                openChargeModal(id);
            });
        });
        // Gán sự kiện cho nút Chi tiết
        document.querySelectorAll('.detail-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                openDetailModal(id, this);
            });
        });
        // Gán sự kiện cho nút Xóa booking_details
        document.querySelectorAll('.delete-detail-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                if (confirm('Bạn có chắc chắn muốn xóa booking này khỏi bảng booking-detail?')) {
                    deleteBookingDetail(id);
                }
            });
        });
    }

    // Hàm xóa booking_details
    async function deleteBookingDetail(id) {
        try {
            const res = await fetch(`http://localhost:3000/booking-details/${id}`, { method: 'DELETE' });
            if (res.ok) {
                alert('Đã xóa booking-detail!');
                fetchBookingDetails();
            } else {
                const text = await res.text();
                alert('Lỗi: ' + text);
            }
        } catch (err) {
            alert('Lỗi kết nối server!');
        }
    }

    // Mở modal chi tiết booking
    function openDetailModal(id, btn) {
        const modal = document.getElementById('detailModal');
        modal.style.display = 'flex';
        document.querySelectorAll('.detail-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const booking = allBookingDetails.find(b => b.id == id);
        // Show transport_companies as 'Công ty nhà xe' if present
        let html = '<table style="width:100%;border-collapse:collapse;">';
        Object.entries(booking).forEach(([key, val]) => {
            let label = key;
            if (key === 'transport_companies') label = 'Công ty nhà xe';
            html += `<tr><td style='font-weight:bold;padding:4px 8px;border:1px solid #eee;'>${label}</td><td style='padding:4px 8px;border:1px solid #eee;'>${val || ''}</td></tr>`;
        });
        html += '</table>';
        document.getElementById('detailFields').innerHTML = html;
    }
    // Đóng modal chi tiết
    function closeDetailModal() {
        document.getElementById('detailModal').style.display = 'none';
        document.querySelectorAll('.detail-btn').forEach(b => b.classList.remove('active'));
    }
    document.getElementById('closeDetailModal').onclick = closeDetailModal;
    document.getElementById('detailModal').onclick = function(e) {
        if (e.target === this) closeDetailModal();
    };

    // Submit form tính phí
    async function submitChargeForm(e) {
        e.preventDefault();
        const id = this.getAttribute('data-id');
        const formData = {};
        [
            // 'transport_company_name','shipping_line',
            'receiving_price','delivery_price','lifting_fee','lifting_invoice','lifting_invoice_date','lifting_invoice_supplier','lowering_fee','lowering_invoice','lowering_invoice_date','lowering_invoice_supplier',
            'thanh_ly','phu_thu','hoa_don','ngay_hd','cai_mep','phi_hun_trung','kiem_hoa','xin_so_cont','qua_tai','phi_van_chuyen','vat_8','ghi_chu'
        ].forEach(field => {
            formData[field] = document.getElementById(field).value;
        });
        // Validation: transport_company_name must not be empty
        if (!formData.transport_company_name || !formData.transport_company_name.trim()) {
            alert('Vui lòng nhập tên công ty nhà xe!');
            document.getElementById('transport_company_name').focus();
            return;
        }
        try {
            const res = await fetch(`http://localhost:3000/booking-details/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (!res.ok) throw new Error('Lỗi khi cập nhật thông tin tính phí');
            closeChargeModal();
            fetchBookingDetails();
        } catch (err) {
            alert('Lỗi khi lưu thông tin tính phí!');
        }
    }
    document.getElementById('chargeForm').onsubmit = submitChargeForm;

    // Khi trang load, lấy danh sách booking_details và công ty nhà xe
    window.addEventListener('DOMContentLoaded', function() {
        fetchBookingDetails();
        loadTransportCompanies();
    });

    document.getElementById('refreshBookingBtn').addEventListener('click', function() {
        fetchBookingDetails();
    });

    // --- BỔ SUNG JS cho nút Chi tiết booking ---

    // Sửa lại renderBookingList để có thêm nút Chi tiết
    function renderBookingList() {
        const tableBody = document.querySelector('#bookingList tbody');
        tableBody.innerHTML = '';
        allBookingDetails.forEach(booking => {
            // Use transport_companies (manually entered) if present, else fallback to transporter_name
            const displayTransportCompany = booking.transport_companies || booking.transporter_name || '';
            // Đã tính phí nếu có bất kỳ trường phí nào đã nhập (ví dụ: receiving_price, delivery_price, lifting_fee, ...)
            const isCharged = !!(booking.receiving_price || booking.delivery_price || booking.lifting_fee || booking.lowering_fee || booking.hoa_don);
            const row = document.createElement('tr');
            row.className = isCharged ? 'charged-row' : 'waiting-charge';
            row.innerHTML = `
                <td>${formatDate(booking.pickup_date) || ''}</td>
                <td>${booking.company_name || ''}</td>
                <td>${displayTransportCompany}</td>
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
                <td style="text-align:center;">
                    <button class="detail-btn action-btn" data-id="${booking.id}">Chi tiết</button>
                    ${!isCharged ? '<button class="charge-btn action-btn" data-id="'+booking.id+'">Tính phí</button>' : '<span style="display:inline-block;min-width:90px;color:#4CAF50;font-weight:600;">Đã tính phí</span>'}
                    <button class="delete-detail-btn action-btn" data-id="${booking.id}" style="background:#dc3545;">Xoá</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        // Gán sự kiện cho nút Tính phí
        document.querySelectorAll('.charge-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                openChargeModal(id);
            });
        });
        // Gán sự kiện cho nút Chi tiết
        document.querySelectorAll('.detail-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                openDetailModal(id, this);
            });
        });
        // Gán sự kiện cho nút Xóa booking_details
        document.querySelectorAll('.delete-detail-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                if (confirm('Bạn có chắc chắn muốn xóa booking này khỏi bảng booking-detail?')) {
                    deleteBookingDetail(id);
                }
            });
        });
    }

    // Hàm xóa booking_details
    async function deleteBookingDetail(id) {
        try {
            const res = await fetch(`http://localhost:3000/booking-details/${id}`, { method: 'DELETE' });
            if (res.ok) {
                alert('Đã xóa booking-detail!');
                fetchBookingDetails();
            } else {
                const text = await res.text();
                alert('Lỗi: ' + text);
            }
        } catch (err) {
            alert('Lỗi kết nối server!');
        }
    }

    // Mở modal chi tiết booking
    function openDetailModal(id, btn) {
        const modal = document.getElementById('detailModal');
        modal.style.display = 'flex';
        document.querySelectorAll('.detail-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const booking = allBookingDetails.find(b => b.id == id);
        // Show transport_companies as 'Công ty nhà xe' if present
        let html = '<table style="width:100%;border-collapse:collapse;">';
        Object.entries(booking).forEach(([key, val]) => {
            let label = key;
            if (key === 'transport_companies') label = 'Công ty nhà xe';
            html += `<tr><td style='font-weight:bold;padding:4px 8px;border:1px solid #eee;'>${label}</td><td style='padding:4px 8px;border:1px solid #eee;'>${val || ''}</td></tr>`;
        });
        html += '</table>';
        document.getElementById('detailFields').innerHTML = html;
    }
    // Đóng modal chi tiết
    function closeDetailModal() {
        document.getElementById('detailModal').style.display = 'none';
        document.querySelectorAll('.detail-btn').forEach(b => b.classList.remove('active'));
    }
    document.getElementById('closeDetailModal').onclick = closeDetailModal;
    document.getElementById('detailModal').onclick = function(e) {
        if (e.target === this) closeDetailModal();
    };

    // Mở modal tính phí
    function openChargeModal(id) {
        const modal = document.getElementById('chargeModal');
        modal.style.display = 'flex';
        // Lấy booking theo id
        const booking = allBookingDetails.find(b => b.id == id);
        // Hiển thị thông tin booking (chỉ các trường của bảng bookings)
        let infoHtml = '';
        [
            ['Mã Booking', booking.booking_no],
            ['Ngày lấy', formatDate(booking.pickup_date)],
            ['Công ty', booking.company_name],
            ['Nhà xe', booking.transporter_name],
            ['Công ty làm Hoá Đơn', booking.invoice_company !== undefined ? booking.invoice_company : ''],
            ['Hãng tàu', booking.shipping_line !== undefined ? booking.shipping_line : ''],
            ['Mã Container', booking.container_code],
            ['Số lượng', booking.quantity],
            ['Kích cỡ', booking.size],
            ['Nơi lấy', booking.pickup_location],
            ['Nơi hạ', booking.dropoff_location],
            ['Loại hình', booking.type],
            ['Chi phí phụ', booking.extra_fee]
        ].forEach(([label, val]) => {
            infoHtml += `<div style="margin-bottom:4px;"><b>${label}:</b> ${val ?? ''}</div>`;
        });
        document.getElementById('bookingInfoFields').innerHTML = infoHtml;
        // Đổ dữ liệu cũ vào form nếu có
        document.getElementById('chargeForm').reset();
        [
            'receiving_price','delivery_price','lifting_fee','lifting_invoice','lifting_invoice_date','lifting_invoice_supplier','lowering_fee','lowering_invoice','lowering_invoice_date','lowering_invoice_supplier',
            'thanh_ly','phu_thu','hoa_don','ngay_hd','cai_mep','phi_hun_trung','kiem_hoa','xin_so_cont','qua_tai','phi_van_chuyen','vat_8','ghi_chu'
        ].forEach(field => {
            if (booking[field]) document.getElementById(field).value = booking[field];
        });
        // Lưu id booking đang sửa vào form
        document.getElementById('chargeForm').setAttribute('data-id', id);
    }
    // Đóng modal tính phí
    function closeChargeModal() {
        document.getElementById('chargeModal').style.display = 'none';
    }
    // Đảm bảo nút đóng và click ngoài modal đều hoạt động
    document.getElementById('closeChargeModal').onclick = closeChargeModal;
    document.getElementById('chargeModal').onclick = function(e) {
        if (e.target === this) closeChargeModal();
    };
});
