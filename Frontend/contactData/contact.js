document.getElementById('contactForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Ngăn chặn hành vi mặc định của form

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;

    try {
        const response = await fetch('http://localhost:3000/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, message }),
        });

        if (response.ok) {
            alert('Email đã được gửi thành công!');
            document.getElementById('contactForm').reset();
        } else {
            alert('Đã xảy ra lỗi khi gửi email.');
        }
    } catch (error) {
        console.error('Lỗi:', error);
        alert('Không thể gửi email. Vui lòng thử lại sau.');
    }
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