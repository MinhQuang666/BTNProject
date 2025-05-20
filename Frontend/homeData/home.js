document.addEventListener('DOMContentLoaded', () => {
    const swiper = new Swiper('.swiper-container', {
        loop: true, // Lặp lại các slide
        autoplay: {
            delay: 3000, // Tự động chuyển slide sau 3 giây
            disableOnInteraction: false,
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
    });
});
document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname; // Lấy đường dẫn hiện tại
    const navLinks = document.querySelectorAll('.navbar ul li a');

    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active'); // Thêm class 'active' vào liên kết phù hợp
        }
    });
});