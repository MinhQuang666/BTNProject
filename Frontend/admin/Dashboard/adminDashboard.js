// Hàm điều hướng đến các trang quản lý
function navigateTo(section) {
    switch (section) {
        case 'container':
            window.location.href = '../containerdata/containerdata.html';
            break;
        case 'customer':
            window.location.href = '../customerData/customer.html';
            break;
        case 'contact':
            window.location.href = '../contactData/contact.html';
            break;
        default:
            console.error('Section không hợp lệ');
    }
}

// Giả lập dữ liệu tổng quan
document.addEventListener('DOMContentLoaded', () => {
    const dropdown = document.querySelector('.dropdown');
    const dropdownMenu = document.querySelector('.dropdown-menu');

    dropdown.addEventListener('click', (e) => {
        if (e.target.classList.contains('dropdown-toggle')) {
            e.preventDefault();
            dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
        }
    });

    // Đóng menu khi nhấp ra ngoài
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
            dropdownMenu.style.display = 'none';
        }
    });
});