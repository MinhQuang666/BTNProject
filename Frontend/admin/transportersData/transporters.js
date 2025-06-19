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

    const detailsButton = document.createElement('button');
    detailsButton.textContent = 'Chi tiết';
    detailsButton.className = 'details';
    detailsButton.onclick = () => showTransporterDetails(transporter.id, transporter.name);
    actionsCell.appendChild(detailsButton);

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
        pageButton.onclick = function() { fetchFunction(Number(this.textContent)); };
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

document.addEventListener('DOMContentLoaded', function() {
    fetchTransporters(1);
});

// Hiển thị modal chi tiết nhà xe và danh sách xe
function showTransporterDetails(transporterId, transporterName) {
    // Tạo modal nếu chưa có
    let modal = document.getElementById('transporterDetailsModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'transporterDetailsModal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'rgba(0,0,0,0.3)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = 99999;
        document.body.appendChild(modal);
    }
    modal.innerHTML = `
        <div style="background:#fff;padding:24px 20px 16px 20px;border-radius:10px;min-width:340px;max-width:95vw;max-height:90vh;overflow:auto;box-shadow:0 2px 16px rgba(0,0,0,0.18);">
            <h2 style="margin-top:0;font-size:1.1rem;">Danh sách xe của nhà xe: <span style='color:#1976d2'>${transporterName}</span></h2>
            <div id="truckListPanel"></div>
            <form id="addTruckForm" style="margin-top:18px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
                <input type="text" id="truckLicense" placeholder="Biển số xe" required style="padding:6px 10px;border-radius:5px;border:1px solid #ccc;min-width:120px;">
                <input type="text" id="truckModel" placeholder="Model (tùy chọn)" style="padding:6px 10px;border-radius:5px;border:1px solid #ccc;min-width:120px;">
                <input type="text" id="truckDriver" placeholder="Tài xế (tùy chọn)" style="padding:6px 10px;border-radius:5px;border:1px solid #ccc;min-width:120px;">
                <button type="submit" style="background:#2196F3;color:#fff;border:none;border-radius:5px;padding:7px 18px;font-weight:500;">Thêm xe</button>
                <button type="button" id="closeTransporterDetailsBtn" style="background:red;color:#fff;border:none;border-radius:5px;padding:7px 18px;font-weight:500;">Đóng</button>
            </form>
        </div>
    `;
    modal.style.display = 'flex';
    // Đóng modal
    modal.querySelector('#closeTransporterDetailsBtn').onclick = function() {
        modal.style.display = 'none';
    };
    // Xử lý thêm xe mới
    modal.querySelector('#addTruckForm').onsubmit = async function(e) {
        e.preventDefault();
        const license = modal.querySelector('#truckLicense').value.trim();
        const model = modal.querySelector('#truckModel').value.trim();
        const driver = modal.querySelector('#truckDriver').value.trim();
        if (!license) {
            alert('Vui lòng nhập biển số xe!');
            return;
        }
        try {
            const res = await fetch('http://localhost:3000/trucks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ license_plate: license, transporter_id: transporterId, model, driver_name: driver })
            });
            if (res.ok) {
                loadTruckList(transporterId);
                this.reset();
            } else {
                const msg = await res.text();
                alert('Lỗi: ' + msg);
            }
        } catch (err) {
            alert('Lỗi kết nối server!');
        }
    };
    // Tải danh sách xe
    loadTruckList(transporterId);
}

// Hàm tải danh sách xe của nhà xe
async function loadTruckList(transporterId) {
    const panel = document.getElementById('truckListPanel');
    panel.innerHTML = '<div>Đang tải danh sách xe...</div>';
    try {
        const res = await fetch(`http://localhost:3000/trucks?transporter_id=${encodeURIComponent(transporterId)}`);
        if (res.ok) {
            const trucks = await res.json();
            if (!trucks.length) {
                panel.innerHTML = '<div style="color:#888;">Chưa có xe nào cho nhà xe này.</div>';
                return;
            }
            let html = `<table style='width:100%;margin-top:10px;border-collapse:collapse;'><thead><tr><th>Biển số</th><th>Model</th><th>Tài xế</th><th>Hành động</th></tr></thead><tbody>`;
            trucks.forEach(truck => {
                html += `<tr>
                    <td>${truck.license_plate}</td>
                    <td>${truck.model||''}</td>
                    <td>${truck.driver_name||''}</td>
                    <td><button onclick="deleteTruck(${truck.id}, '${truck.transporter_id}')" style='background:#e53935;color:#fff;border:none;border-radius:4px;padding:4px 10px;cursor:pointer;'>Xóa</button></td>
                </tr>`;
            });
            html += '</tbody></table>';
            panel.innerHTML = html;
        } else {
            panel.innerHTML = '<div style="color:red;">Lỗi tải danh sách xe!</div>';
        }
    } catch (err) {
        panel.innerHTML = '<div style="color:red;">Lỗi kết nối server!</div>';
    }
}

// Hàm xóa xe
async function deleteTruck(truckId, transporterId) {
    if (!confirm('Bạn có chắc chắn muốn xóa xe này?')) return;
    try {
        const res = await fetch(`http://localhost:3000/trucks/${truckId}`, { method: 'DELETE' });
        if (res.ok) {
            loadTruckList(transporterId);
        } else {
            alert('Lỗi xóa xe!');
        }
    } catch (err) {
        alert('Lỗi kết nối server!');
    }
}