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
        const filterDate = filterDateInput.value;
        let bookingsToShow = allBookings;
        if (filterDate) {
            bookingsToShow = allBookings.filter(b => (b.pickup_date && b.pickup_date.startsWith(filterDate)));
        }
        bookingsToShow.forEach(booking => {
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

    // Sự kiện lọc
    document.getElementById('filterBtn').addEventListener('click', renderBookingList);
    document.getElementById('clearFilterBtn').addEventListener('click', function() {
        filterDateInput.value = '';
        renderBookingList();
    });

    // Tải dữ liệu ban đầu
    fetchBookings();
});
