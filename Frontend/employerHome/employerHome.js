document.addEventListener('DOMContentLoaded', () => {
    const dailyContainerBtn = document.getElementById('daily-container-btn');

    // Xử lý sự kiện khi nhấn nút
    dailyContainerBtn.addEventListener('click', () => {
        // Điều hướng đến trang nhập dữ liệu container
        window.location.href = '/Frontend/containerData/containerdata.html';
    });
});