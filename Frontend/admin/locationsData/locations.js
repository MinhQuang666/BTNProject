document.addEventListener('DOMContentLoaded', fetchLocations);

async function fetchLocations(page = 1) {
    try {
        const response = await fetch(`http://localhost:3000/locations?page=${page}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        const { locations } = data;

        const tableBody = document.getElementById('locationTableBody');
        tableBody.innerHTML = ''; // Xóa các hàng cũ

        locations.forEach(location => {
            const newRow = renderLocationRow(location);
            tableBody.appendChild(newRow);
        });
    } catch (error) {
        console.error('Error fetching locations:', error);
    }
}

function renderLocationRow(location) {
    const newRow = document.createElement('tr');

    const idCell = document.createElement('td');
    idCell.textContent = location.id;
    newRow.appendChild(idCell);

    const nameCell = document.createElement('td');
    nameCell.textContent = location.name;
    newRow.appendChild(nameCell);

    const imageCell = document.createElement('td');
    const img = document.createElement('img');
    img.src = location.image_url;
    img.alt = location.name;
    img.style.width = '100px'; // Kích thước ảnh
    imageCell.appendChild(img);
    newRow.appendChild(imageCell);

    const actionsCell = document.createElement('td');

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Xóa';
    deleteButton.className = 'delete';
    deleteButton.onclick = () => deleteLocation(location.id);
    actionsCell.appendChild(deleteButton);

    const updateButton = document.createElement('button');
    updateButton.textContent = 'Sửa';
    updateButton.className = 'update';
    updateButton.onclick = () => updateLocation(location.id, location.name, location.image_url);
    actionsCell.appendChild(updateButton);

    newRow.appendChild(actionsCell);

    return newRow;
}

async function addLocation() {
    const locationId = document.getElementById('locationId').value;
    const locationName = document.getElementById('locationName').value;
    const locationImage = document.getElementById('locationImage').value;

    if (!locationId || !locationName) {
        alert('Vui lòng nhập đầy đủ thông tin.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/locations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: locationId, name: locationName, image_url: locationImage }),
        });

        if (response.ok) {
            fetchLocations(); // Làm mới danh sách địa điểm
            hideForm(); // Ẩn form sau khi thêm thành công
        } else {
            const errorText = await response.text();
            alert(errorText); // Hiển thị lỗi từ backend
        }
    } catch (error) {
        console.error('Error adding location:', error);
    }
}

async function deleteLocation(id) {
    try {
        const response = await fetch(`http://localhost:3000/locations/${id}`, { method: 'DELETE' });

        if (response.ok) {
            fetchLocations(); // Làm mới danh sách địa điểm
        } else {
            const errorText = await response.text();
            alert(errorText); // Hiển thị lỗi từ backend
        }
    } catch (error) {
        console.error('Error deleting location:', error);
    }
}

async function updateLocation(id, currentName, currentImageUrl) {
    const newName = prompt('Nhập tên địa điểm mới:', currentName);
    const newImageUrl = prompt('Nhập URL ảnh mới:', currentImageUrl);

    if (!newName) {
        alert('Vui lòng nhập tên địa điểm.');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/locations/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName, image_url: newImageUrl }),
        });

        if (response.ok) {
            fetchLocations(); // Làm mới danh sách địa điểm
        } else {
            const errorText = await response.text();
            alert(errorText); // Hiển thị lỗi từ backend
        }
    } catch (error) {
        console.error('Error updating location:', error);
    }
}

function renderPagination(totalPages, currentPage, fetchFunction) {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = '';

    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.className = i === currentPage ? 'active' : '';
        pageButton.onclick = () => fetchFunction(i);
        paginationContainer.appendChild(pageButton);
    }
}

function showForm() {
    document.getElementById('showFormButton').style.display = 'none';
    document.getElementById('locationForm').style.display = 'block';
    document.getElementById('formButtons').style.display = 'block'; // Hiển thị nút Lưu và Hủy
}

function hideForm() {
    document.getElementById('locationForm').style.display = 'none';
    document.getElementById('formButtons').style.display = 'none'; // Ẩn nút Lưu và Hủy
    document.getElementById('showFormButton').style.display = 'block';
    document.getElementById('locationForm').reset();
}

function searchLocation() {
    const input = document.getElementById('searchInput').value.toUpperCase();
    const table = document.getElementById('locationTableBody');
    const rows = table.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        const nameCell = rows[i].getElementsByTagName('td')[1];
        if (nameCell) {
            const nameText = nameCell.textContent || nameCell.innerText;
            rows[i].style.display = nameText.toUpperCase().indexOf(input) > -1 ? '' : 'none';
        }
    }
}

function refreshData() {
    fetchLocations();
}