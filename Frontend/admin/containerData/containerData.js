// Hàm kiểm tra định dạng mã số container
function isValidContainerCode(containerCode) {
    const regex = /^[A-Z]{4}[0-9]{7}$/;
    return regex.test(containerCode);
}

async function addContainer() {
    let containerCode = document.getElementById('containerId').value;
    containerCode = containerCode.trim();
    const containerSize = document.getElementById('containerSize').value;
    const ownerCode = document.getElementById('containerOwner').value;

    if (!containerCode || containerCode.length !== 11) {
        alert('Mã số container phải có 11 ký tự.');
        return;
    }
    if (!isValidContainerCode(containerCode)) {
        alert('Mã số container không hợp lệ. Mã số Container phải là ABCD1234567.');
        return;
    }
    if (!ownerCode) {
        alert('Vui lòng chọn chủ sở hữu.');
        return;
    }
    try {
        const response = await fetch('http://localhost:3000/containers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ container_code: containerCode, size: containerSize, owner_code: ownerCode }),
        });

        if (response.ok) {
            fetchContainers(); // Làm mới danh sách container
            hideForm(); // Ẩn form sau khi thêm thành công
        } else {
            const errorText = await response.text();
            alert(errorText); // Hiển thị lỗi từ backend
        }
    } catch (error) {
        console.error('Error adding container:', error);
    }
}

async function deleteContainer(containerCode) {
    if (!confirm('Bạn có chắc chắn muốn xóa container này?')) return;
    try {
        const response = await fetch(`http://localhost:3000/containers/${containerCode}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorText = await response.text();
            alert(errorText); // Hiển thị lỗi từ backend
            return;
        }

        // Làm mới danh sách container sau khi xóa
        fetchContainers();
    } catch (error) {
        console.error('Error deleting container:', error);
        alert('Không thể xóa container. Vui lòng thử lại.');
    }
}

async function fetchOwners() {
    try {
        const response = await fetch('http://localhost:3000/container-owners');
        if (!response.ok) throw new Error('Lỗi khi lấy danh sách chủ sở hữu');
        const owners = await response.json();
        const ownerSelect = document.getElementById('containerOwner');
        ownerSelect.innerHTML = '<option value="">--Chọn công ty--</option>';
        owners.forEach(owner => {
            const option = document.createElement('option');
            option.value = owner.owner_code;
            option.textContent = `${owner.owner_code} - ${owner.name || ''}`;
            ownerSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching owners:', error);
    }
}

// Sửa container: mở form với dữ liệu hiện tại và cho phép chỉnh owner
async function updateContainer(containerCode, currentSize) {
    // Lấy dữ liệu container hiện tại từ bảng (hoặc fetch lại nếu cần)
    const tableRows = document.getElementById('containerTableBody').getElementsByTagName('tr');
    let ownerCode = '';
    for (let row of tableRows) {
        if (row.cells[0].textContent === containerCode) {
            ownerCode = row.cells[2].textContent;
            break;
        }
    }
    // Hiển thị form và điền dữ liệu
    showForm();
    await fetchOwners();
    document.getElementById('containerId').value = containerCode;
    document.getElementById('containerSize').value = currentSize;
    document.getElementById('containerOwner').value = ownerCode;
    // Đổi nút Lưu để cập nhật
    const saveBtn = document.querySelector('#formButtons button[onclick^="addContainer"]');
    saveBtn.textContent = 'Cập nhật';
    saveBtn.onclick = async function() {
        const newContainerCode = document.getElementById('containerId').value.trim();
        const newSize = document.getElementById('containerSize').value;
        const newOwnerCode = document.getElementById('containerOwner').value;
        if (!isValidContainerCode(newContainerCode)) {
            alert('Mã số container không hợp lệ. Mã số Container phải là ABCD1234567.');
            return;
        }
        if (!newOwnerCode) {
            alert('Vui lòng chọn chủ sở hữu.');
            return;
        }
        try {
            const response = await fetch(`http://localhost:3000/containers/${containerCode}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    new_container_code: newContainerCode,
                    size: newSize,
                    owner_code: newOwnerCode
                })
            });
            if (response.status === 400) {
                const errorText = await response.text();
                alert(errorText);
            } else if (response.ok) {
                fetchContainers();
                hideForm();
                // Đặt lại nút Lưu về trạng thái thêm mới
                saveBtn.textContent = 'Lưu';
                saveBtn.onclick = addContainer;
            }
        } catch (error) {
            console.error('Error updating container:', error);
            alert('Không thể sửa container. Vui lòng thử lại.');
        }
    };
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

    const codeCell = document.createElement('td');
    codeCell.textContent = container.container_code;
    newRow.appendChild(codeCell);

    const sizeCell = document.createElement('td');
    sizeCell.textContent = container.size;
    newRow.appendChild(sizeCell);

    const ownerCodeCell = document.createElement('td');
    ownerCodeCell.textContent = container.owner_code;
    newRow.appendChild(ownerCodeCell);

    const ownerNameCell = document.createElement('td');
    ownerNameCell.textContent = container.owner_name;
    newRow.appendChild(ownerNameCell);

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
    // Hiển thị form nhập thông tin
    document.getElementById('containerForm').style.display = 'block';
    document.getElementById('formButtons').style.display = 'block';

    // Ẩn nút Thêm container
    document.getElementById('showFormButton').style.display = 'none';
    fetchOwners();
}

// Ẩn form nhập thông tin
function hideForm() {
    // Ẩn form nhập thông tin
    document.getElementById('containerForm').style.display = 'none';
    document.getElementById('formButtons').style.display = 'none';

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

// Lắng nghe sự kiện cập nhật tên công ty từ trang codecontainerOwner.html
window.addEventListener('storage', function(event) {
    if (event.key === 'containerOwnerUpdated') {
        fetchContainers(); // Tự động reload bảng container khi tên công ty đổi
    }
});

// Fetch containers on page load
document.addEventListener('DOMContentLoaded', fetchContainers);