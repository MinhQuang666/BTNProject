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
            updateSummaryPanel();
            renderBookingList();
        } catch (err) {
            console.error('Lỗi khi load booking_details:', err);
        }
    }

    // Cập nhật panel tóm tắt
    function updateSummaryPanel() {
        // Tổng Booking = tổng số dòng booking_details
        document.getElementById('totalBookings').textContent = allBookingDetails.length;
        // Chưa tính = số booking_details có charged == false
        const notCharged = allBookingDetails.filter(b => !b.charged).length;
        document.getElementById('totalContainers').textContent = notCharged;
        // Đã tính phí = số booking_details có charged == true
        const charged = allBookingDetails.filter(b => b.charged).length;
        document.getElementById('totalQuantity').textContent = charged;
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
            const displayTransportCompany = booking.transport_companies || booking.transporter_name || '';
            const isCharged = booking.charged === true;
            let statusHtml = '';
            if (isCharged) {
                statusHtml = '<span style="display:inline-block;padding:2px 10px;border-radius:8px;background:#4CAF50;color:#fff;font-weight:600;">Đã tính phí</span>';
            } else {
                statusHtml = '<span style="display:inline-block;padding:2px 10px;border-radius:8px;background:#FFC107;color:#333;font-weight:600;">Chờ tính phí</span>';
            }
            const row = document.createElement('tr');
            row.className = isCharged ? 'charged-row' : 'waiting-charge';
            row.innerHTML = `
                <td>${formatDate(booking.pickup_date) || ''}</td>
                <td>${booking.company_name || ''}</td>
                <td>${displayTransportCompany}</td>
                <td>${booking.booking_no || ''}</td>
                <td>${booking.container_code || ''}</td>
                <td>${statusHtml}</td>
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
                    <button class="charge-btn action-btn" data-id="${booking.id}" style="background:${isCharged ? '#2196F3' : '#FFC107'};color:${isCharged ? '#fff' : '#333'};font-weight:600;">${isCharged ? 'Sửa' : 'Tính phí'}</button>
                    <button class="delete-detail-btn action-btn" data-id="${booking.id}" style="background:#dc3545;">Xoá</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        // Gán sự kiện cho nút Tính phí/Sửa
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
                if (confirm('Bạn có chắc chắn muốn xóa booking này')) {
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
                alert('Đã xóa booking');
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
        // Map field keys to user-friendly Vietnamese labels (fixed order)
        const fieldLabels = [
            ['booking_no', 'Số Booking'],
            ['pickup_date', 'Ngày lấy'],
            ['company_name', 'Công ty'],
            ['transporter_name', 'Nhà xe'],
            ['invoice_company', 'Công ty làm Hoá Đơn'],
            ['shipping_line', 'Hãng tàu'],
            ['container_code', 'Mã số Container'],
            ['quantity', 'Số lượng'],
            ['size', 'Kích cỡ'],
            ['pickup_location', 'Nơi lấy Container'],
            ['dropoff_location', 'Nơi hạ Container'],
            ['type', 'Loại hình'],
            ['extra_fee', 'Chi phí phụ'],
            ['receiving_price', 'Giá nhận'],
            ['delivery_price', 'Giá giao ngoài xe'],
            ['lifting_fee', 'Phí nâng'],
            ['lowering_fee', 'Phí hạ'],
            ['lifting_invoice', 'Hóa đơn phí nâng'],
            ['lowering_invoice', 'Hóa đơn phí hạ'],
            ['lifting_invoice_date', 'Ngày hóa đơn phí nâng'],
            ['lowering_invoice_date', 'Ngày hóa đơn phí hạ'],
            ['lifting_invoice_supplier', 'Nhà cung cấp hóa đơn phí nâng'],
            ['lowering_invoice_supplier', 'Nhà cung cấp hóa đơn phí hạ'],
            ['thanh_ly', 'Thanh lý'],
            ['phu_thu', 'Phụ thu'],
            ['hoa_don', 'Hóa đơn'],
            ['ngay_hd', 'Ngày hóa đơn'],
            ['cai_mep', 'Cái Mép'],
            ['phi_hun_trung', 'Phí hun trùng'],
            ['kiem_hoa', 'Kiểm hóa'],
            ['xin_so_cont', 'Xin số cont'],
            ['qua_tai', 'Quá tải'],
            ['phi_van_chuyen', 'Phí vận chuyển'],
            ['vat_8', 'VAT (8%)'],
            ['ghi_chu', 'Ghi chú'],
            ['id', 'ID']
        ];
        let html = '<table style="width:100%;border-collapse:collapse;">';
        // Xác định các trường số để hiển thị VNĐ (chỉ các trường tiền, không bao gồm quantity, size)
        const numericFields = [
            'receiving_price','delivery_price','lifting_fee','lowering_fee','phu_thu','phi_hun_trung','kiem_hoa','qua_tai','phi_van_chuyen','vat_8','extra_fee'
        ];
        fieldLabels.forEach(([key, label]) => {
            let val = booking[key];
            let displayVal = val;
            if (key.includes('date') && val) displayVal = formatDate(val);
            if (displayVal === '/') {
                displayVal = '<span style="color:#aaa;">(trống)</span>';
            } else if (numericFields.includes(key)) {
                if (displayVal === undefined || displayVal === null || displayVal === '') {
                    displayVal = '<span style="color:#aaa;">0 VNĐ</span>';
                } else if (!isNaN(displayVal)) {
                    displayVal = formatMoneyDisplay(displayVal);
                }
            } else {
                if (displayVal === undefined || displayVal === null || displayVal === '') {
                    displayVal = '<span style="color:#aaa;">(trống)</span>';
                }
            }
            html += `<tr><td style='font-weight:600;padding:4px 8px;'>${label}</td><td style='padding:4px 8px;'>${displayVal}</td></tr>`;
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
        const booking = allBookingDetails.find(b => b.id == id);
        const formData = {};
        formData.transport_company_name = booking ? (booking.transport_companies || booking.transporter_name || '') : '';
        formData.shipping_line = booking ? (booking.shipping_line || '') : '';
        [
            'receiving_price','delivery_price','lifting_fee','lifting_invoice','lifting_invoice_date','lifting_invoice_supplier','lowering_fee','lowering_invoice','lowering_invoice_date','lowering_invoice_supplier',
            'thanh_ly','phu_thu','hoa_don','ngay_hd','cai_mep','phi_hun_trung','kiem_hoa','xin_so_cont','qua_tai','phi_van_chuyen','vat_8','ghi_chu'
        ].forEach(field => {
            formData[field] = document.getElementById(field).value;
        });
        // Đánh dấu đã tính phí
        formData.charged = true;
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
            const displayTransportCompany = booking.transport_companies || booking.transporter_name || '';
            const isCharged = booking.charged === true;
            let statusHtml = '';
            if (isCharged) {
                statusHtml = '<span style="display:inline-block;padding:2px 10px;border-radius:8px;background:#4CAF50;color:#fff;font-weight:600;">Đã tính phí</span>';
            } else {
                statusHtml = '<span style="display:inline-block;padding:2px 10px;border-radius:8px;background:#FFC107;color:#333;font-weight:600;">Chờ tính phí</span>';
            }
            const row = document.createElement('tr');
            row.className = isCharged ? 'charged-row' : 'waiting-charge';
            row.innerHTML = `
                <td>${formatDate(booking.pickup_date) || ''}</td>
                <td>${booking.company_name || ''}</td>
                <td>${displayTransportCompany}</td>
                <td>${booking.booking_no || ''}</td>
                <td>${booking.container_code || ''}</td>
                <td>${statusHtml}</td>
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
                    <button class="charge-btn action-btn" data-id="${booking.id}" style="background:${isCharged ? '#2196F3' : '#FFC107'};color:${isCharged ? '#fff' : '#333'};font-weight:600;">${isCharged ? 'Sửa' : 'Tính phí'}</button>
                    <button class="delete-detail-btn action-btn" data-id="${booking.id}" style="background:#dc3545;">Xoá</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        // Gán sự kiện cho nút Tính phí/Sửa
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
        // Map field keys to user-friendly Vietnamese labels (fixed order)
        const fieldLabels = [
            ['booking_no', 'Số Booking'],
            ['pickup_date', 'Ngày lấy'],
            ['company_name', 'Công ty'],
            ['transporter_name', 'Nhà xe'],
            ['invoice_company', 'Công ty làm Hoá Đơn'],
            ['shipping_line', 'Hãng tàu'],
            ['container_code', 'Mã số Container'],
            ['quantity', 'Số lượng'],
            ['size', 'Kích cỡ'],
            ['pickup_location', 'Nơi lấy Container'],
            ['dropoff_location', 'Nơi hạ Container'],
            ['type', 'Loại hình'],
            ['extra_fee', 'Chi phí phụ'],
            ['receiving_price', 'Giá nhận'],
            ['delivery_price', 'Giá giao ngoài xe'],
            ['lifting_fee', 'Phí nâng'],
            ['lowering_fee', 'Phí hạ'],
            ['lifting_invoice', 'Hóa đơn phí nâng'],
            ['lowering_invoice', 'Hóa đơn phí hạ'],
            ['lifting_invoice_date', 'Ngày hóa đơn phí nâng'],
            ['lowering_invoice_date', 'Ngày hóa đơn phí hạ'],
            ['lifting_invoice_supplier', 'Nhà cung cấp hóa đơn phí nâng'],
            ['lowering_invoice_supplier', 'Nhà cung cấp hóa đơn phí hạ'],
            ['thanh_ly', 'Thanh lý'],
            ['phu_thu', 'Phụ thu'],
            ['hoa_don', 'Hóa đơn'],
            ['ngay_hd', 'Ngày hóa đơn'],
            ['cai_mep', 'Cái Mép'],
            ['phi_hun_trung', 'Phí hun trùng'],
            ['kiem_hoa', 'Kiểm hóa'],
            ['xin_so_cont', 'Xin số cont'],
            ['qua_tai', 'Quá tải'],
            ['phi_van_chuyen', 'Phí vận chuyển'],
            ['vat_8', 'VAT (8%)'],
            ['ghi_chu', 'Ghi chú'],
            ['id', 'ID']
        ];
        let html = '<table style="width:100%;border-collapse:collapse;">';
        // Xác định các trường số để hiển thị VNĐ (chỉ các trường tiền, không bao gồm quantity, size)
        const numericFields = [
            'receiving_price','delivery_price','lifting_fee','lowering_fee','phu_thu','phi_hun_trung','kiem_hoa','qua_tai','phi_van_chuyen','vat_8','extra_fee'
        ];
        fieldLabels.forEach(([key, label]) => {
            let val = booking[key];
            let displayVal = val;
            if (key.includes('date') && val) displayVal = formatDate(val);
            if (displayVal === '/') {
                displayVal = '<span style="color:#aaa;">(trống)</span>';
            } else if (numericFields.includes(key)) {
                if (displayVal === undefined || displayVal === null || displayVal === '') {
                    displayVal = '<span style="color:#aaa;">0 VNĐ</span>';
                } else if (!isNaN(displayVal)) {
                    displayVal = formatMoneyDisplay(displayVal);
                }
            } else {
                if (displayVal === undefined || displayVal === null || displayVal === '') {
                    displayVal = '<span style="color:#aaa;">(trống)</span>';
                }
            }
            html += `<tr><td style='font-weight:600;padding:4px 8px;'>${label}</td><td style='padding:4px 8px;'>${displayVal}</td></tr>`;
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
            const input = document.getElementById(field);
            // List of numeric fields that should default to 0
            const numericFields = [
                'receiving_price','delivery_price','lifting_fee','lowering_fee','phu_thu','phi_hun_trung','kiem_hoa','qua_tai','phi_van_chuyen','vat_8'
            ];
            const dateFields = [
                'lifting_invoice_date','lowering_invoice_date','ngay_hd'
            ];
            if (booking[field] !== undefined && booking[field] !== null && booking[field] !== '') {
                // If date field, format to yyyy-MM-dd for input type="date"
                if (dateFields.includes(field)) {
                    let dateVal = booking[field];
                    if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
                        // If already yyyy-MM-dd, use as is
                        input.value = dateVal;
                    } else {
                        // Parse and adjust for timezone offset
                        const d = new Date(dateVal);
                        if (!isNaN(d)) {
                            const tzOffset = d.getTimezoneOffset() * 60000;
                            const localISO = new Date(d.getTime() - tzOffset).toISOString().slice(0,10);
                            input.value = localISO;
                        } else {
                            input.value = '';
                        }
                    }
                } else {
                    input.value = booking[field];
                }
            } else if (numericFields.includes(field)) {
                input.value = 0;
            } else {
                input.value = '';
            }
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

    // Utility: format number with thousand separators and VNĐ
    // (see above for new implementation)
    function formatMoneyInput(value) {
        if (value === '' || value === null || value === undefined) return '';
        let num = value.toString().replace(/[^\d]/g, '');
        if (!num) return '';
        num = parseInt(num, 10);
        if (isNaN(num)) return '';
        return num.toLocaleString('vi-VN') + ' VNĐ';
    }

    // Utility: get raw number from formatted string
    function parseMoneyInput(value) {
        if (!value) return 0;
        return parseInt(value.toString().replace(/[^\d]/g, ''), 10) || 0;
    }

    // Attach formatting to money fields in charge form
    function setupMoneyInputFormatting() {
        const moneyFields = [
            'receiving_price','delivery_price','lifting_fee','lowering_fee','phu_thu','phi_hun_trung','kiem_hoa','qua_tai','phi_van_chuyen','vat_8'
        ];
        moneyFields.forEach(field => {
            const input = document.getElementById(field);
            if (!input) return;
            // Format on input
            input.addEventListener('input', function(e) {
                const caret = input.selectionStart;
                const raw = input.value.replace(/[^\d]/g, '');
                if (raw === '') {
                    input.value = '';
                    return;
                }
                input.value = formatMoneyInput(raw);
                // Try to keep caret at end
                input.setSelectionRange(input.value.length, input.value.length);
            });
            // On focus, show only number
            input.addEventListener('focus', function() {
                const raw = input.value.replace(/[^\d]/g, '');
                input.value = raw;
            });
            // On blur, format
            input.addEventListener('blur', function() {
                const raw = input.value.replace(/[^\d]/g, '');
                input.value = formatMoneyInput(raw);
            });
            // Initial format if value exists
            if (input.value && !isNaN(input.value)) {
                input.value = formatMoneyInput(input.value);
            }
        });
    }

    // Call setup after DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupMoneyInputFormatting);
    } else {
        setupMoneyInputFormatting();
    }

    // Patch submitChargeForm to send raw values
    const originalSubmitChargeForm = submitChargeForm;
    async function patchedSubmitChargeForm(e) {
        e.preventDefault();
        const id = this.getAttribute('data-id');
        const booking = allBookingDetails.find(b => b.id == id);
        const formData = {};
        formData.transport_company_name = booking ? (booking.transport_companies || booking.transporter_name || '') : '';
        formData.shipping_line = booking ? (booking.shipping_line || '') : '';
        [
            'receiving_price','delivery_price','lifting_fee','lifting_invoice','lifting_invoice_date','lifting_invoice_supplier','lowering_fee','lowering_invoice','lowering_invoice_date','lowering_invoice_supplier',
            'thanh_ly','phu_thu','hoa_don','ngay_hd','cai_mep','phi_hun_trung','kiem_hoa','xin_so_cont','qua_tai','phi_van_chuyen','vat_8','ghi_chu'
        ].forEach(field => {
            const input = document.getElementById(field);
            if (!input) return;
            if ([
                'receiving_price','delivery_price','lifting_fee','lowering_fee','phu_thu','phi_hun_trung','kiem_hoa','qua_tai','phi_van_chuyen','vat_8'
            ].includes(field)) {
                formData[field] = parseMoneyInput(input.value);
            } else {
                formData[field] = input.value;
            }
        });
        formData.charged = true;
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
    document.getElementById('chargeForm').onsubmit = patchedSubmitChargeForm;

    // Utility: format number with thousand separators and VNĐ
    function formatMoneyDisplay(value) {
        if (value === '' || value === null || value === undefined) return '';
        let num = value.toString().replace(/[^\d]/g, '');
        if (!num) return '';
        num = parseInt(num, 10);
        if (isNaN(num)) return '';
        return num.toLocaleString('vi-VN') + ' VNĐ';
    }
});
