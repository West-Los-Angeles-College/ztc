/* scripts.js — WLAC ZTC search table + cart wiring
   - Loads ztc_live.csv and renders a table (supports quoted CSV)
   - Adds an “Add” button per row that saves to a shared cart (localStorage)
   - Shows a small Term badge next to each Add button
   - Injects the selected Term from index.html’s <select id="termSelect"> into every added item
*/

(function(){
  const STORAGE_KEY = 'wlacZtcCartV1';
  const $ = (s, c=document)=>c.querySelector(s);
  const $$ = (s, c=document)=>Array.from(c.querySelectorAll(s));

  // ---- Cart primitives -----------------------------------------------------
  function loadCart(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }
  function saveCart(items){ localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
  function addToCart(item){
    const items = loadCart();
    items.push(item);
    saveCart(items);
  }
  function inCart(course, section){
    return loadCart().some(i => (i.course===course && i.section===section));
  }

  // Expose a minimal API if one is not defined (so index.html can patch it)
  if (!window.WLAC_ZTC_CART){
    window.WLAC_ZTC_CART = {
      add: (item)=> addToCart(item),
      list: ()=> loadCart(),
      clear: ()=> saveCart([])
    };
  }

  // ---- Term helpers --------------------------------------------------------
  function currentTerm(){
    const el = document.getElementById('termSelect');
    return el && el.value ? el.value : '';
  }
  function makeTermBadge(){
    const b = document.createElement('small');
    b.className = 'term-badge';
    b.textContent = currentTerm() || 'Term not set';
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
    // Robust CSV parser with quotes and escaped quotes
    const rows = [];
    const lines = text.split(/\r?\n/);
    for (let line of lines){
      if (!line || /^\s*$/.test(line)) continue;
      const out = [];
      let cur = '', q = false;
      for (let i=0; i<line.length; i++){
        const ch = line[i], nxt = line[i+1];
        if (ch === '"'){
          if (q && nxt === '"'){ cur += '"'; i++; }
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

  // ---- Build table from CSV -----------------------------------------------
  const table = $('#courseTable, #ztcTable'); // support either id
  const tbody = table ? (table.tBodies[0] || table.createTBody()) : null;
  const searchInput = $('#search');

  function rowToObject(headers, row){
    const obj = {};
    headers.forEach((h,i)=> obj[h] = (row[i] ?? '').trim());
    return obj;
  }

  function headerCase(h){
    // Normalize all-upper headers like COURSE -> Course (for display)
    return h ? h.charAt(0).toUpperCase() + h.slice(1).toLowerCase() : h;
  }

  function buildTable(headers, rows){
    // Normalize display headers
    const displayHeaders = headers.map(h=>headerCase(h));
    // Ensure standard order if CSV is missing any
    const required = ['Course','Term','Section','Instructor','Units','Days','Time','Location'];
    const idx = name => headers.findIndex(h => h.toLowerCase() === name.toLowerCase());
    const positions = required.map(r => idx(r) >= 0 ? idx(r) : -1);

    const thead = table.tHead || table.createTHead();
    thead.innerHTML = '';
    const trh = document.createElement('tr');
    displayHeaders.forEach(h=>{
      const th = document.createElement('th');
      th.textContent = h;
      trh.appendChild(th);
    });
    const thAdd = document.createElement('th'); thAdd.textContent = 'Add'; trh.appendChild(thAdd);
    thead.appendChild(trh);

    tbody.innerHTML = '';
    for (const row of rows){
      const objRaw = rowToObject(headers, row);

      // Build a normalized object using required field names
      const obj = {
        Course: positions[0] >= 0 ? row[positions[0]] : (objRaw.Course || objRaw.COURSE || ''),
        Term: positions[1] >= 0 ? row[positions[1]] : (objRaw.Term || objRaw.TERM || ''),
        Section: positions[2] >= 0 ? row[positions[2]] : (objRaw.Section || objRaw.SECTION || ''),
        Instructor: positions[3] >= 0 ? row[positions[3]] : (objRaw.Instructor || objRaw.INSTRUCTOR || ''),
        Units: positions[4] >= 0 ? row[positions[4]] : (objRaw.Units || objRaw.UNITS || ''),
        Days: positions[5] >= 0 ? row[positions[5]] : (objRaw.Days || objRaw.DAYS || ''),
        Time: positions[6] >= 0 ? row[positions[6]] : (objRaw.Time || objRaw.TIME || ''),
        Location: positions[7] >= 0 ? row[positions[7]] : (objRaw.Location || objRaw.LOCATION || '')
      };

      const tr = document.createElement('tr');

      // Render cells in the order of displayHeaders (original CSV order)
      displayHeaders.forEach(h=>{
        const key = h;
        const td = document.createElement('td');
        td.textContent = obj[key] || '';
        tr.appendChild(td);
      });

      // Add button + Term badge
      const tdBtn = document.createElement('td');
      tdBtn.className = 'add-cell';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = inCart(obj.Course, obj.Section) ? 'Added' : 'Add';
      btn.disabled = inCart(obj.Course, obj.Section);
      btn.addEventListener('click', ()=>{
        const payload = {
          course: obj.Course || '',
          section: obj.Section || '',
          term: (currentTerm() || obj.Term || ''),
          instructor: obj.Instructor || '',
          units: obj.Units || '',
          days: obj.Days || '',
          time: obj.Time || '',
          location: obj.Location || ''
        };
        if (window.WLAC_ZTC_CART && typeof window.WLAC_ZTC_CART.add === 'function'){
          window.WLAC_ZTC_CART.add(payload);
        } else {
          addToCart(payload);
        }
        btn.textContent = 'Added';
        btn.disabled = true;
        try { document.dispatchEvent(new Event('wlac-cart-updated')); } catch(_) {}
      });

      tdBtn.appendChild(btn);
      tdBtn.appendChild(makeTermBadge());
      tr.appendChild(tdBtn);

      tbody.appendChild(tr);
    }
  }

  // ---- Hydrate existing server-rendered table (fallback) -------------------
  function hydrateExisting(){
    const headCells = $$('#courseTable thead th, #ztcTable thead th').map(th=>th.textContent.trim());
    const headers = headCells.length ? headCells.slice(0, -1) : ['Course','Term','Section','Instructor','Units','Days','Time','Location']; // assume last is Add
    const theadRow = $('#courseTable thead tr, #ztcTable thead tr');
    if (theadRow){
      const lastText = theadRow.lastElementChild?.textContent?.trim();
      if (lastText !== 'Add'){
        const th = document.createElement('th'); th.textContent = 'Add';
        theadRow.appendChild(th);
      }
    }

    $$('#courseTable tbody tr, #ztcTable tbody tr').forEach(tr=>{
      const cells = $$('td', tr).map(td=>td.textContent.trim());
      const obj = {};
      headers.forEach((h,i)=> obj[h] = cells[i] || '');

      const tdBtn = document.createElement('td');
      tdBtn.className = 'add-cell';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = inCart(obj.Course, obj.Section) ? 'Added' : 'Add';
      btn.disabled = inCart(obj.Course, obj.Section);
      btn.addEventListener('click', ()=>{
        const payload = {
          course: obj.Course || '',
          section: obj.Section || '',
          term: (currentTerm() || obj.Term || ''),
          instructor: obj.Instructor || '',
          units: obj.Units || '',
          days: obj.Days || '',
          time: obj.Time || '',
          location: obj.Location || ''
        };
        if (window.WLAC_ZTC_CART && typeof window.WLAC_ZTC_CART.add === 'function'){
          window.WLAC_ZTC_CART.add(payload);
        } else {
          addToCart(payload);
        }
        btn.textContent = 'Added';
        btn.disabled = true;
        try { document.dispatchEvent(new Event('wlac-cart-updated')); } catch(_) {}
      });

      tdBtn.appendChild(btn);
      tdBtn.appendChild(makeTermBadge());
      tr.appendChild(tdBtn);
    });
  }

  // ---- Filtering -----------------------------------------------------------
  function applyFilter(term){
    const t = (term || '').toLowerCase();
    $$('#courseTable tbody tr, #ztcTable tbody tr').forEach(tr=>{
      const show = tr.textContent.toLowerCase().includes(t);
      tr.style.display = show ? '' : 'none';
    });
  }
  const searchInput = $('#search');
  if (searchInput){
    searchInput.addEventListener('input', e=> applyFilter(e.target.value));
  }

  // ---- Initialize from CSV (with graceful fallback) ------------------------
  const table = $('#courseTable, #ztcTable');
  const tbody = table ? (table.tBodies[0] || table.createTBody()) : null;
  if (table && tbody){
    loadCSV('ztc_live.csv')
      .then(rows=>{
        if (!rows || !rows.length) throw new Error('Empty CSV');
        const [headers, ...data] = rows;
        buildTable(headers, data);
      })
      .catch(err=>{
        console.warn('CSV load failed or not found. Falling back to existing table. Reason:', err);
        hydrateExisting();
      });
  }

  // ---- Live-update badges when Term changes --------------------------------
  const termSelect = document.getElementById('termSelect');
  if (termSelect){
    termSelect.addEventListener('change', ()=>{
      document.querySelectorAll('.term-badge').forEach(el => el.textContent = currentTerm() || 'Term not set');
    });
  }

})();