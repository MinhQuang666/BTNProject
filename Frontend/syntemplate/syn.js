document.addEventListener('DOMContentLoaded', () => {
    // Khởi tạo Swiper
    const swiper = new Swiper('.swiper-container', {
        loop: true, // Vòng lặp
        autoplay: {
            delay: 3000, // Tự động chuyển slide sau 3 giây
            disableOnInteraction: false, // Không dừng autoplay khi tương tác
        },
        slidesPerView: 1.2, // Hiển thị một phần của ảnh kế tiếp
        spaceBetween: 10, // Khoảng cách giữa các slide
        pagination: {
            el: '.swiper-pagination',
            clickable: true, // Cho phép click vào pagination
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        speed: 500, // Tốc độ chuyển đổi slide (500ms)
    });

    // Tự động thêm class 'active' vào liên kết trong navbar
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.navbar ul li a');

    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });

    // Dropdown menu toggle
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