/* scripts.js — enhanced to add “Add to Cart” buttons that save to the same
   localStorage cart used by ztc_index.html
   Assumes there is a table with id="courseTable" and an optional search input with id="search".
*/

(function(){
  const STORAGE_KEY = 'wlacZtcCartV1';
  const $ = (s, c=document)=>c.querySelector(s);
  const $$ = (s, c=document)=>Array.from(c.querySelectorAll(s));

  const table = $('#courseTable');
  const tbody = table ? table.querySelector('tbody') : null;
  const searchInput = $('#search');

  if (!table || !tbody) return;

  // Utility: cart load/save
  const loadCart = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  };
  const saveCart = (items) => localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  const addToCart = (item) => { const items = loadCart(); items.push(item); saveCart(items); };
  const inCart = (course, section) => loadCart().some(i => i.course===course && i.section===section);

  // Optional: CSV load helper (kept from original package behavior)
  async function loadCSV(path){
    const res = await fetch(path);
    const text = await res.text();
    return parseCSV(text);
  }

  function parseCSV(text){
    // Simple CSV parser supporting quoted values
    const rows = [];
    const lines = text.split(/\r?\n/).filter(Boolean);
    for (const line of lines){
      const out = []; let cur = ''; let q = false;
      for (let i=0;i<line.length;i++){
        const ch = line[i], nxt = line[i+1];
        if (ch==='"'){
          if (q && nxt==='"'){ cur += '"'; i++; }
          else { q = !q; }
        } else if (ch===',' && !q){ out.push(cur); cur=''; }
        else { cur += ch; }
      }
      out.push(cur);
      rows.push(out.map(s=>s.trim()))
    }
    return rows;
  }

  // Builds the table with an extra "Add" column
  function buildTable(headers, rows){
    // Ensure we have standard columns; if headers absent, use defaults
    if (!headers || headers.length < 1){
      headers = ['Course','Section','Instructor','Units','Days','Time','Location'];
    }

    // Append Add column header (if not already present)
    const thead = table.tHead || table.createTHead();
    thead.innerHTML = '';
    const trh = document.createElement('tr');
    headers.forEach(h=>{ const th = document.createElement('th'); th.textContent = h; trh.appendChild(th); });
    const thAdd = document.createElement('th'); thAdd.textContent = 'Add'; trh.appendChild(thAdd);
    thead.appendChild(trh);

    // Body
    tbody.innerHTML = '';
    for (const row of rows){
      const obj = rowToObject(headers, row);
      const tr = document.createElement('tr');
      headers.forEach(h=>{
        const td = document.createElement('td');
        td.textContent = obj[h] || '';
        tr.appendChild(td);
      });
      const tdBtn = document.createElement('td');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = inCart(obj.Course, obj.Section) ? 'Added' : 'Add';
      btn.disabled = inCart(obj.Course, obj.Section);
      btn.addEventListener('click', ()=>{
        addToCart({
          course: obj.Course || '',
          section: obj.Section || '',
          instructor: obj.Instructor || '',
          units: obj.Units || '',
          days: obj.Days || '',
          time: obj.Time || '',
          location: obj.Location || ''
        });
        btn.textContent = 'Added';
        btn.disabled = true;
      });
      tdBtn.appendChild(btn);
      tr.appendChild(tdBtn);
      tbody.appendChild(tr);
    }
  }

  function rowToObject(headers, row){
    const obj = {};
    headers.forEach((h, i)=> obj[h] = row[i] ?? '');
    return obj;
  }

  // Filter function
  function applyFilter(term){
    const t = (term||'').toLowerCase();
    $$('#courseTable tbody tr').forEach(tr=>{
      const show = tr.textContent.toLowerCase().includes(t);
      tr.style.display = show ? '' : 'none';
    });
  }

  if (searchInput){ searchInput.addEventListener('input', e=> applyFilter(e.target.value)); }

  // Initialize: if table already contains rows (server-rendered), just add buttons
  function hydrateExisting(){
    const headCells = $$('#courseTable thead th').map(th=>th.textContent.trim());
    const headers = headCells.length ? headCells : ['Course','Section','Instructor','Units','Days','Time','Location'];

    // If no Add column, append it
    const theadRow = $('#courseTable thead tr');
    if (theadRow && (headCells[headCells.length-1] !== 'Add')){
      const th = document.createElement('th'); th.textContent = 'Add'; theadRow.appendChild(th);
    }

    // For each existing row, add button cell
    $$('#courseTable tbody tr').forEach(tr=>{
      const cells = $$('td', tr).map(td=>td.textContent.trim());
      const obj = rowToObject(headers, cells);
      const tdBtn = document.createElement('td');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = inCart(obj.Course, obj.Section) ? 'Added' : 'Add';
      btn.disabled = inCart(obj.Course, obj.Section);
      btn.addEventListener('click', ()=>{
        addToCart({
          course: obj.Course || '', section: obj.Section || '', instructor: obj.Instructor || '',
          units: obj.Units || '', days: obj.Days || '', time: obj.Time || '', location: obj.Location || ''
        });
        btn.textContent = 'Added'; btn.disabled = true;
      });
      tdBtn.appendChild(btn); tr.appendChild(tdBtn);
    });
  }

  // If your package populates from a CSV, load it here by uncommenting:
  // loadCSV('ztc_live.csv').then(rows=>{
  //   const [headers, ...data] = rows;
  //   buildTable(headers, data);
  // });

  // Otherwise, hydrate whatever is already in the DOM
  hydrateExisting();
})();
