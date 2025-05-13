async function fetchTransporters(page = 1) {
    try {
        const response = await fetch(`http://localhost:3000/transporters?page=${page}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        const { transporters, totalPages, currentPage } = data;

        const tableBody = document.getElementById('transporterTableBody');
        tableBody.innerHTML = ''; // Xóa các hàng cũ

        transporters.forEach(transporter => {
            const newRow = renderTransporterRow(transporter);
            tableBody.appendChild(newRow);
        });

        renderPagination(totalPages, currentPage, fetchTransporters);
    } catch (error) {
        console.error('Error fetching transporters:', error);
    }
}

function renderTransporterRow(transporter) {
    const newRow = document.createElement('tr');

    const idCell = document.createElement('td');
    idCell.textContent = transporter.id;
    newRow.appendChild(idCell);

    const nameCell = document.createElement('td');
    nameCell.textContent = transporter.name;
    newRow.appendChild(nameCell);

    const actionsCell = document.createElement('td');

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Xóa';
    deleteButton.className = 'delete';
    deleteButton.onclick = () => deleteTransporter(transporter.id);
    actionsCell.appendChild(deleteButton);

    const updateButton = document.createElement('button');
    updateButton.textContent = 'Sửa';
    updateButton.className = 'update';
    updateButton.onclick = () => updateTransporter(transporter.id, transporter.name);
    actionsCell.appendChild(updateButton);

    newRow.appendChild(actionsCell);

    return newRow;
}

async function addTransporter() {
    const transporterId = document.getElementById('transporterId').value;
    const transporterName = document.getElementById('transporterName').value;

    if (!transporterId) {
        alert('Vui lòng nhập ID nhà xe.');
        return;
    }

    if (!transporterName) {
        alert('Vui lòng nhập tên nhà xe.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/transporters', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: transporterId, name: transporterName }),
        });

        if (response.ok) {
            fetchTransporters(); // Làm mới danh sách nhà xe
            hideForm(); // Ẩn form sau khi thêm thành công
        } else if (response.status === 409) {
            // Xử lý lỗi trùng lặp
            alert('ID hoặc tên nhà xe đã tồn tại. Vui lòng nhập thông tin khác.');
        } else {
            const errorText = await response.text();
            alert(errorText); // Hiển thị lỗi khác từ backend
        }
    } catch (error) {
        console.error('Error adding transporter:', error);
    }
}

async function deleteTransporter(id) {
    try {
        const response = await fetch(`http://localhost:3000/transporters/${id}`, { method: 'DELETE' });

        if (response.ok) {
            fetchTransporters(); // Làm mới danh sách nhà xe
        } else {
            const errorText = await response.text();
            alert(errorText); // Hiển thị lỗi từ backend
        }
    } catch (error) {
        console.error('Error deleting transporter:', error);
    }
}

async function updateTransporter(id, currentName) {
    const newName = prompt('Nhập tên nhà xe mới:', currentName);

    if (!newName) {
        alert('Vui lòng nhập tên nhà xe.');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/transporters/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName }),
        });

        if (response.ok) {
            fetchTransporters();
        } else {
            const errorText = await response.text();
            alert(errorText);
        }
    } catch (error) {
        console.error('Error updating transporter:', error);
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
    document.getElementById('transporterForm').style.display = 'block';
    document.getElementById('formButtons').style.display = 'block'; // Hiển thị nút Lưu và Hủy
}

function hideForm() {
    document.getElementById('transporterForm').style.display = 'none';
    document.getElementById('formButtons').style.display = 'none'; // Ẩn nút Lưu và Hủy
    document.getElementById('showFormButton').style.display = 'block';
    document.getElementById('transporterForm').reset();
}

function searchTransporter() {
    const input = document.getElementById('searchInput').value.toUpperCase();
    const table = document.getElementById('transporterTableBody');
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
    fetchTransporters();
}
document.addEventListener('DOMContentLoaded', fetchTransporters);