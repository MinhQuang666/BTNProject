document.addEventListener('DOMContentLoaded', fetchCompanies);

async function fetchCompanies(page = 1) {
    try {
        const response = await fetch(`http://localhost:3000/companies?page=${page}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        const { companies, totalPages, currentPage } = data;

        const tableBody = document.getElementById('companyTableBody');
        tableBody.innerHTML = ''; // Clear old rows

        companies.forEach(company => {
            const newRow = renderCompanyRow(company);
            tableBody.appendChild(newRow);
        });

        renderPagination(totalPages, currentPage, fetchCompanies);
    } catch (error) {
        console.error('Error fetching companies:', error);
    }
}

function renderCompanyRow(company) {
    const newRow = document.createElement('tr');

    const idCell = document.createElement('td');
    idCell.textContent = company.id;
    newRow.appendChild(idCell);

    const nameCell = document.createElement('td');
    nameCell.textContent = company.name;
    newRow.appendChild(nameCell);

    const actionsCell = document.createElement('td');

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Xóa';
    deleteButton.className = 'delete';
    deleteButton.onclick = () => deleteCompany(company.id);
    actionsCell.appendChild(deleteButton);

    const updateButton = document.createElement('button');
    updateButton.textContent = 'Sửa';
    updateButton.className = 'update';
    updateButton.onclick = () => updateCompany(company.id, company.name);
    actionsCell.appendChild(updateButton);

    newRow.appendChild(actionsCell);

    return newRow;
}

async function addCompany() {
    const companyName = document.getElementById('companyName').value;

    if (!companyName) {
        alert('Vui lòng nhập tên công ty.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/companies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: companyName }),
        });

        if (response.ok) {
            fetchCompanies();
            hideForm();
        } else {
            const errorText = await response.text();
            alert(errorText);
        }
    } catch (error) {
        console.error('Error adding company:', error);
    }
}

async function deleteCompany(id) {
    try {
        await fetch(`http://localhost:3000/companies/${id}`, { method: 'DELETE' });
        fetchCompanies();
    } catch (error) {
        console.error('Error deleting company:', error);
    }
}

async function updateCompany(id, currentName) {
    const newName = prompt('Nhập tên công ty mới:', currentName);

    if (!newName) {
        alert('Vui lòng nhập tên công ty.');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/companies/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName }),
        });

        if (response.ok) {
            fetchCompanies();
        } else {
            const errorText = await response.text();
            alert(errorText);
        }
    } catch (error) {
        console.error('Error updating company:', error);
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
    document.getElementById('companyForm').style.display = 'block';
}

function hideForm() {
    document.getElementById('companyForm').style.display = 'none';
    document.getElementById('showFormButton').style.display = 'block';
    document.getElementById('companyForm').reset();
}

function searchCompany() {
    const input = document.getElementById('searchInput').value.toUpperCase();
    const table = document.getElementById('companyTableBody');
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
    fetchCompanies();
}