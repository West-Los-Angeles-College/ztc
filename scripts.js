/* scripts.js — WLAC ZTC Search + Cart Wiring
   - Loads ztc_live.csv and renders a table
   - Adds an “Add” button per row that saves FULL details to a shared cart (localStorage)
   - Injects the selected Term from index.html’s <select id="termSelect"> when present
   - Optional: shows a small Term badge next to Add
*/

(function(){
  const STORAGE_KEY = 'wlacZtcCartV1';
  const $ = (s, c=document)=>c.querySelector(s);
  const $$ = (s, c=document)=>Array.from(c.querySelectorAll(s));

  // ---- Cart helpers --------------------------------------------------------
  function loadCart(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }
  function saveCart(items){ localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
  function addToCart(item){
    const items = loadCart();
    items.push(item);
    saveCart(items);
    // announce for any badges
    try { document.dispatchEvent(new Event('wlac-cart-updated')); } catch(_) {}
  }
  function inCart(course, section){
    return loadCart().some(i => (i.course===course && i.section===section));
  }

  // ---- Term helpers --------------------------------------------------------
  function currentTerm(){
    const el = document.getElementById('termSelect');
    return el && el.value ? el.value : '';
  }
  function makeTermBadge(){
    const b = document.createElement('small');
    b.className = 'term-badge';
    b.textContent = currentTerm() || '';
    return b;
  }

  // ---- CSV loader / parser -------------------------------------------------
  async function loadCSV(path){
    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
    const text = await res.text();
    return parseCSV(text);
  }

  function parseCSV(text){
    // Supports quoted fields and embedded commas
    const rows = [];
    const lines = text.split(/(?:\r\n|\n|\r)/);
    for (const line of lines){
      if (!line.trim()) continue;
      const out = [];
      let cur = '', q = false;
      for (let i=0; i<line.length; i++){
        const ch = line[i], nx = line[i+1];
        if (ch === '"'){
          if (q && nx === '"'){ cur += '"'; i++; }
          else { q = !q; }
        } else if (ch === ',' && !q){
          out.push(cur); cur = '';
        } else {
          cur += ch;
        }
      }
      out.push(cur);
      rows.push(out.map(s=>s.trim()));
    }
    return rows;
  }

  // ---- Build table ---------------------------------------------------------
  const table = $('#ztcTable') || $('#courseTable');
  const tbody = table ? (table.tBodies[0] || table.createTBody()) : null;
  const searchInput = $('#search');

  function rowToObject(headers, row){
    const obj = {};
    headers.forEach((h,i)=> obj[h] = (row[i] ?? '').trim());
    return obj;
  }

  function buildTable(headers, rows){
    // Normalize expected headers; fall back if missing
    let H = headers && headers.length ? headers : ['Course','Term','Section','Instructor','Units','Days','Time','Location'];

    // Build thead with Add column
    const thead = table.tHead || table.createTHead();
    thead.innerHTML = '';
    const trh = document.createElement('tr');
    H.forEach(h=>{
      const th = document.createElement('th');
      th.textContent = h;
      trh.appendChild(th);
    });
    const thAdd = document.createElement('th'); thAdd.textContent = 'Add';
    trh.appendChild(thAdd);
    thead.appendChild(trh);

    // Body
    tbody.innerHTML = '';
    for (const row of rows){
      const obj = rowToObject(H, row);
      const tr = document.createElement('tr');
      // write visible cells
      H.forEach(h=>{
        const td = document.createElement('td');
        td.textContent = obj[h] || '';
        tr.appendChild(td);
      });

      // Add button + term badge
      const tdBtn = document.createElement('td');
      tdBtn.className = 'add-cell';
      const btn = document.createElement('button');
      btn.type = 'button';
      const course = obj.Course || '';
      const section = obj.Section || '';
      btn.textContent = inCart(course, section) ? 'Added' : 'Add';
      btn.disabled = inCart(course, section);
      btn.addEventListener('click', ()=>{
        const payload = {
          course:     course,
          term:       (currentTerm() || obj.Term || ''),
          section:    section,
          instructor: obj.Instructor || '',
          units:      obj.Units || '',
          days:       obj.Days || '',
          time:       obj.Time || '',
          location:   obj.Location || ''
        };
        addToCart(payload);
        btn.textContent = 'Added';
        btn.disabled = true;
      });
      tdBtn.appendChild(btn);

      // Optional badge showing current term (if selector present)
      const badge = makeTermBadge();
      if (badge.textContent) tdBtn.appendChild(badge);

      tr.appendChild(tdBtn);
      // mark row with data-term for filtering
      tr.dataset.term = (obj.Term || '').toLowerCase();
      tbody.appendChild(tr);
    }
  }

  // ---- Hydrate server-rendered table (fallback) ----------------------------
  function hydrateExisting(){
    const headCells = $$('#ztcTable thead th, #courseTable thead th').map(th=>th.textContent.trim());
    let H = headCells.length ? headCells.slice(0) : ['Course','Term','Section','Instructor','Units','Days','Time','Location'];
    // Ensure Add header
    const headRow = $('#ztcTable thead tr, #courseTable thead tr');
    if (headRow){
      const last = headRow.lastElementChild?.textContent?.trim();
      if (last !== 'Add'){ const th = document.createElement('th'); th.textContent = 'Add'; headRow.appendChild(th); }
    }
    $$('#ztcTable tbody tr, #courseTable tbody tr').forEach(tr=>{
      const cells = $$('td', tr).map(td=>td.textContent.trim());
      const obj = rowToObject(H, cells);
      const tdBtn = document.createElement('td');
      tdBtn.className = 'add-cell';
      const btn = document.createElement('button');
      btn.type = 'button';
      const course = obj.Course || '';
      const section = obj.Section || '';
      btn.textContent = inCart(course, section) ? 'Added' : 'Add';
      btn.disabled = inCart(course, section);
      btn.addEventListener('click', ()=>{
        const payload = {
          course:     course,
          term:       (currentTerm() || obj.Term || ''),
          section:    section,
          instructor: obj.Instructor || '',
          units:      obj.Units || '',
          days:       obj.Days || '',
          time:       obj.Time || '',
          location:   obj.Location || ''
        };
        addToCart(payload);
        btn.textContent = 'Added';
        btn.disabled = true;
      });
      tdBtn.appendChild(btn);
      const badge = makeTermBadge();
      if (badge.textContent) tdBtn.appendChild(badge);
      tr.appendChild(tdBtn);
      tr.dataset.term = (obj.Term || '').toLowerCase();
    });
  }

  // ---- Text filter + Term filter ------------------------------------------
  function applyTextFilter(q){
    const t = (q || '').toLowerCase();
    $$('#ztcTable tbody tr, #courseTable tbody tr').forEach(tr=>{
      const show = tr.textContent.toLowerCase().includes(t);
      tr.style.display = show ? '' : 'none';
    });
  }
  const search = $('#search');
  if (search){ search.addEventListener('input', e=> applyTextFilter(e.target.value)); }

  function applyTermFilter(){
    const tsel = (currentTerm() || '').toLowerCase();
    if (!tsel) return; // no filter
    $$('#ztcTable tbody tr, #courseTable tbody tr').forEach(tr=>{
      tr.style.display = (!tr.dataset.term || tr.dataset.term === tsel) ? '' : 'none';
    });
  }

  // ---- Initialize ----------------------------------------------------------
  if (table && tbody){
    loadCSV('ztc_live.csv')
      .then(rows=>{
        if (!rows || !rows.length) throw new Error('Empty CSV');
        const [headers, ...data] = rows;
        buildTable(headers, data);
        applyTermFilter();
      })
      .catch(err=>{
        console.warn('CSV load failed, hydrating existing table:', err);
        hydrateExisting();
        applyTermFilter();
      });
  }

  // Update term badges/filter on change
  const termSelect = document.getElementById('termSelect');
  if (termSelect){
    termSelect.addEventListener('change', ()=>{
      // update badges
      document.querySelectorAll('.term-badge').forEach(el => el.textContent = currentTerm() || '');
      applyTermFilter();
    });
  }

})();