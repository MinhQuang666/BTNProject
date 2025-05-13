// Dữ liệu mã công ty sở hữu (lưu tạm thời)
let ownerData = [];

// Hàm hiển thị form thêm mã công ty
function showForm() {
    document.getElementById('ownerForm').style.display = 'block';
    document.getElementById('formButtons').style.display = 'block';
    document.getElementById('showFormButton').style.display = 'none';
}

// Hàm ẩn form thêm mã công ty
function hideForm() {
    document.getElementById('ownerForm').style.display = 'none';
    document.getElementById('formButtons').style.display = 'none';
    document.getElementById('showFormButton').style.display = 'block';
    document.getElementById('ownerForm').reset(); // Reset form
}

// Hàm hiển thị danh sách mã công ty sở hữu
function renderOwnerTable() {
    const tableBody = document.getElementById('ownerTableBody');
    tableBody.innerHTML = ''; // Xóa dữ liệu cũ

    ownerData.forEach((owner, index) => {
        const newRow = document.createElement('tr');

        const codeCell = document.createElement('td');
        codeCell.textContent = owner.owner_code;
        newRow.appendChild(codeCell);

        const nameCell = document.createElement('td');
        nameCell.textContent = owner.name;
        newRow.appendChild(nameCell);

        const actionsCell = document.createElement('td');
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Xóa';
        deleteButton.className = 'delete';
        deleteButton.onclick = () => deleteOwner(index);
        actionsCell.appendChild(deleteButton);
        newRow.appendChild(actionsCell);

        tableBody.appendChild(newRow);
    });
}

// Hàm thêm mã công ty sở hữu
async function addOwner() {
    const ownerCode = document.getElementById('ownerCode').value.toUpperCase();
    const ownerName = document.getElementById('ownerName').value;

    if (!ownerCode || ownerCode.length !== 3) {
        alert('Mã công ty phải có đúng 3 ký tự.');
        return;
    }

    if (!ownerName) {
        alert('Vui lòng nhập tên công ty.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/container-owners', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ owner_code: ownerCode, name: ownerName }),
        });

        if (response.ok) {
            const newOwner = await response.json();
            ownerData.push(newOwner); // Cập nhật mảng tạm thời
            renderOwnerTable(); // Cập nhật bảng
            hideForm(); // Ẩn form sau khi thêm thành công
        } else {
            const errorText = await response.text();
            alert(errorText); // Hiển thị lỗi từ backend
        }
    } catch (error) {
        console.error('Error adding owner:', error);
    }
}

// Hàm xóa mã công ty sở hữu
async function deleteOwner(index) {
    const ownerCode = ownerData[index].owner_code;

    if (confirm('Bạn có chắc chắn muốn xóa mã công ty này?')) {
        try {
            const response = await fetch(`http://localhost:3000/container-owners/${ownerCode}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorText = await response.text();
                alert(errorText); // Hiển thị lỗi từ backend
                return;
            }

            // Xóa mã công ty khỏi mảng tạm thời
            ownerData.splice(index, 1);
            renderOwnerTable(); // Cập nhật bảng
        } catch (error) {
            console.error('Error deleting container owner:', error);
            alert('Không thể xóa mã công ty. Vui lòng thử lại.');
        }
    }
}

// Hàm lấy danh sách mã công ty sở hữu
async function fetchOwners() {
    try {
        const response = await fetch('http://localhost:3000/container-owners');
        if (!response.ok) throw new Error('Lỗi khi lấy danh sách mã công ty.');

        ownerData = await response.json(); // Cập nhật mảng tạm thời
        renderOwnerTable(); // Hiển thị dữ liệu trong bảng
    } catch (error) {
        console.error('Error fetching owners:', error);
    }
}

// Gọi hàm fetchOwners khi trang được tải
document.addEventListener('DOMContentLoaded', fetchOwners);