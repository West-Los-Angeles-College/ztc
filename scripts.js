async function loadCSV() {
    const response = await fetch('ztc_live.csv');
    const data = await response.text();
    const rows = data.trim().split('\n').map(r => r.split(','));

    const tableBody = document.querySelector('#courseTable tbody');
    tableBody.innerHTML = '';

    rows.slice(1).forEach(row => {
        const tr = document.createElement('tr');
        row.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });

    document.querySelector('#search').addEventListener('input', function() {
        const query = this.value.toLowerCase();
        document.querySelectorAll('#courseTable tbody tr').forEach(tr => {
            tr.style.display = tr.textContent.toLowerCase().includes(query) ? '' : 'none';
        });
    });
}
loadCSV();
