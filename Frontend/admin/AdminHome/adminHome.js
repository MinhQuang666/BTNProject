// Hàm kiểm tra định dạng mã số container
function isValidContainerCode(containerCode) {
    const regex = /^[A-Z]{4}[0-9]{7}$/;
    return regex.test(containerCode);
}

async function addContainer() {
    const containerId = document.getElementById('containerId').value;
    const containerSize = document.getElementById('containerSize').value;

    if (!isValidContainerCode(containerId)) {
        alert('Mã số container không hợp lệ. Mã số Container phải là ABCD1234567.');
        return;
    }

    if (containerId && containerSize) {
        try {
            const response = await fetch('http://localhost:3000/containers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    container_code: containerId,
                    size: containerSize,
                }),
            });

            if (response.status === 400) {
                const errorText = await response.text();
                alert(errorText);
            } else if (response.ok) {
                // Refresh table
                fetchContainers();
                document.getElementById('containerForm').reset();
            }
        } catch (error) {
            console.error('Error adding container:', error);
        }
    } else {
        alert('Vui lòng nhập đầy đủ thông tin.');
    }
}

async function deleteContainer(containerCode) {
    try {
        await fetch(`http://localhost:3000/containers/${containerCode}`, {
            method: 'DELETE',
        });

        // Làm mới danh sách container sau khi xóa
        fetchContainers();
    } catch (error) {
        console.error('Error deleting container:', error);
        alert('Không thể xóa container. Vui lòng thử lại.');
    }
}

async function updateContainer(containerCode, currentSize) {
    const newContainerCode = prompt('Nhập mã số container mới:', containerCode);
    const newSize = prompt('Nhập kích cỡ mới:', currentSize);

    if (!isValidContainerCode(newContainerCode)) {
        alert('Mã số container không hợp lệ. Mã số Container phải là ABCD1234567.');
        return;
    }

    if (newContainerCode && newSize) {
        try {
            const response = await fetch(`http://localhost:3000/containers/${containerCode}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    new_container_code: newContainerCode,
                    size: newSize,
                }),
            });

            if (response.status === 400) {
                const errorText = await response.text();
                alert(errorText);
            } else if (response.ok) {
                // Refresh table
                fetchContainers();
            }
        } catch (error) {
            console.error('Error updating container:', error);
            ('Không thể sửa container. Vui lòng thử lại.');
        }
    } else {
        alert('Vui lòng nhập đầy đủ thông tin.');
    }
}

async function uploadExcel() {
    const fileInput = document.getElementById('excelFileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert('Vui lòng chọn file Excel.');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('http://localhost:3000/upload', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            alert('File đã được xử lý thành công.');
            fetchContainers(); // Làm mới danh sách container
        } else {
            const errorText = await response.text();
            alert(`Lỗi: ${errorText}`);
        }
    } catch (error) {
        console.error('Error uploading file:', error);
        alert('Không thể tải lên file. Vui lòng thử lại.');
    }
}

function renderContainerRow(container) {
    const newRow = document.createElement('tr');

    const idCell = document.createElement('td');
    idCell.textContent = container.container_code;
    newRow.appendChild(idCell);

    const sizeCell = document.createElement('td');
    sizeCell.textContent = container.size;
    newRow.appendChild(sizeCell);

    const actionsCell = document.createElement('td');

    // Nút Xóa
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Xóa';
    deleteButton.className = 'delete';
    deleteButton.onclick = () => deleteContainer(container.container_code);
    actionsCell.appendChild(deleteButton);

    // Nút Sửa
    const updateButton = document.createElement('button');
    updateButton.textContent = 'Sửa';
    updateButton.className = 'update';
    updateButton.onclick = () => updateContainer(container.container_code, container.size);
    actionsCell.appendChild(updateButton);

    newRow.appendChild(actionsCell);

    return newRow;
}

async function fetchContainers() {
    try {
        const response = await fetch('http://localhost:3000/containers');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const containers = await response.json();

        const tableBody = document.getElementById('containerTableBody');
        tableBody.innerHTML = ''; // Xóa các hàng cũ

        containers.forEach(container => {
            const newRow = renderContainerRow(container);
            tableBody.appendChild(newRow);
        });
    } catch (error) {
        console.error('Error fetching containers:', error);
    }
}

function renderPagination(totalPages, currentPage) {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = ''; // Xóa các nút cũ

    if (totalPages <= 1) return; // Không hiển thị phân trang nếu chỉ có 1 trang

    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.className = i === currentPage ? 'active' : '';
        pageButton.onclick = () => fetchContainers(i);
        paginationContainer.appendChild(pageButton);
    }
}

// Hiển thị form nhập thông tin
function showForm() {
    // Ẩn nút Thêm container
    document.getElementById('showFormButton').style.display = 'none';

    // Hiển thị form nhập thông tin
    document.getElementById('containerForm').style.display = 'block';
}

// Ẩn form nhập thông tin
function hideForm() {
    // Ẩn form nhập thông tin
    document.getElementById('containerForm').style.display = 'none';

    // Hiển thị lại nút Thêm container
    document.getElementById('showFormButton').style.display = 'block';

    // Xóa dữ liệu trong form
    document.getElementById('containerForm').reset();
}
// Tìm kiếm container
function searchContainer() {
    const input = document.getElementById('searchInput').value.toUpperCase();
    const table = document.getElementById('containerTableBody');
    const rows = table.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        const idCell = rows[i].getElementsByTagName('td')[0];
        if (idCell) {
            const idText = idCell.textContent || idCell.innerText;
            rows[i].style.display = idText.toUpperCase().indexOf(input) > -1 ? '' : 'none';
        }
    }
}

function refreshData() {
    fetchContainers(); // Gọi lại hàm fetchContainers để làm mới dữ liệu
}

// Fetch containers on page load
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

    // Tự động thêm class 'active' vào liên kết trong navbar
    const currentPath = window.location.pathname; // Lấy đường dẫn hiện tại
    const navLinks = document.querySelectorAll('.navbar ul li a');

    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active'); // Thêm class 'active' vào liên kết phù hợp
        }
    });
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
