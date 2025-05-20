document.addEventListener('DOMContentLoaded', () => {
    // Hiệu ứng đổi màu từ từ cho từng thẻ card
    const cards = document.querySelectorAll('.card');

    cards.forEach((card, index) => {
        const colorSets = [
            ['linear-gradient(90deg,rgb(18, 247, 26),white)', 'linear-gradient(90deg,rgb(43, 182, 50), white)', 'linear-gradient(90deg, #2E7D32, white)'], // Xanh lá
            ['linear-gradient(90deg, #FF9800, white)', 'linear-gradient(90deg, #F57C00, white)', 'linear-gradient(90deg, #E65100, white)'], // Cam
            ['linear-gradient(90deg, #2196F3, white)', 'linear-gradient(90deg, #1976D2, white)', 'linear-gradient(90deg, #0D47A1, white)']  // Xanh dương
        ];

        const colors = colorSets[index % colorSets.length];
        let colorIndex = 0;

        setInterval(() => {
            card.style.background = colors[colorIndex];
            card.style.transition = 'background 2s ease';
            colorIndex = (colorIndex + 1) % colors.length;
        }, 3000 + index * 1000);
    });

    // Biểu đồ tổng quan
    const ctx = document.getElementById('overviewChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Doanh thu', 'Chi phí', 'Lợi nhuận'],
            datasets: [{
                data: [1000000000, 500000000, 500000000],
                backgroundColor: ['#4CAF50', '#FF9800', '#2196F3'],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });

    // Biểu đồ tổng số container hôm nay
    const todayCtx = document.getElementById('todayContainersChart').getContext('2d');
    new Chart(todayCtx, {
        type: 'doughnut',
        data: {
            labels: ['Hoàn thành', 'Delay', 'Cancel', 'Nguyên nhân khác'],
            datasets: [{
                data: [50, 20, 10, 5], // Số liệu mẫu
                backgroundColor: ['#4CAF50', '#FFC107', '#F44336', '#9E9E9E'], // Màu sắc cho từng trạng thái
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
});