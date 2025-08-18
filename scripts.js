/* scripts.js — WLAC ZTC search table + cart wiring (with Term auto-filter)
   - Loads ztc_live.csv and renders a table (#ztcTable or #courseTable)
   - Adds an “Add” button per row that saves to a shared cart (localStorage)
   - Shows a small Term pill next to each Add button
   - Injects the currently selected Term (from #termSelect) into every added item
   - NEW: Automatically filters the table to the selected Term on load and when Term changes
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
  const termSelect = $('#termSelect');
  function currentTerm(){
    return termSelect && termSelect.value ? termSelect.value : '';
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
    // Simple CSV parser supporting quoted values
    const rows = [];
    const lines = text.split(/\r?\n/).filter(l => l.trim().length);
    for (const line of lines){
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

  function rowToObject(headers, row){
    const obj = {};
    headers.forEach((h,i)=> obj[h] = (row[i] ?? '').trim());
    return obj;
  }

  function buildTable(headers, rows){
    // Normalize headers to Title Case. Expect: Course, Term, Section, Instructor, Units, Days, Time, Location
    const norm = headers.map(h => (h || '').trim().replace(/\s+/g,' '));
    const H = norm;

    // Build thead + Add column
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

    // Build body
    tbody.innerHTML = '';
    for (const row of rows){
      const obj = rowToObject(H, row);
      const tr = document.createElement('tr');
      tr.dataset.term = obj.Term || ''; // store term for filtering

      H.forEach(h=>{
        const td = document.createElement('td');
        td.textContent = obj[h] || '';
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
          instructor: obj.Instructor || '',
          units: obj.Units || '',
          days: obj.Days || '',
          time: obj.Time || '',
          location: obj.Location || '',
          term: currentTerm() || obj.Term || ''
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

  // ---- Hydrate existing server-rendered table ------------------------------
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
      // Map headers to values
      const obj = rowToObject(headers, cells);
      tr.dataset.term = obj.Term || tr.dataset.term || '';

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
          instructor: obj.Instructor || '',
          units: obj.Units || '',
          days: obj.Days || '',
          time: obj.Time || '',
          location: obj.Location || '',
          term: currentTerm() || obj.Term || ''
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
  function filterToSelectedTerm(){
    const term = (currentTerm() || '').toLowerCase();
    $$('#courseTable tbody tr, #ztcTable tbody tr').forEach(tr=>{
      const t = (tr.dataset.term || '').toLowerCase();
      tr.style.display = (!term || !t) ? '' : (t === term ? '' : 'none');
    });
  }

  // Search box text filter (works in addition to Term filter)
  const searchInput = $('#search');
  function applyTextFilter(){
    const text = (searchInput && searchInput.value || '').toLowerCase();
    $$('#courseTable tbody tr, #ztcTable tbody tr').forEach(tr=>{
      const visibleNow = tr.style.display !== 'none';
      if (!visibleNow) return; // keep hidden if term filter hid it
      const show = tr.textContent.toLowerCase().includes(text);
      tr.style.display = show ? '' : 'none';
    });
  }
  if (searchInput){
    searchInput.addEventListener('input', ()=>{
      filterToSelectedTerm();
      applyTextFilter();
    });
  }

  // ---- Initialize from CSV (with graceful fallback) ------------------------
  if (table && tbody){
    loadCSV('ztc_live.csv')
      .then(rows=>{
        if (!rows || !rows.length) throw new Error('Empty CSV');
        const [headers, ...data] = rows;
        buildTable(headers, data);
        // Auto-filter by selected Term after building
        filterToSelectedTerm();
        applyTextFilter();
      })
      .catch(err=>{
        console.warn('CSV load failed or not found. Falling back to existing table. Reason:', err);
        hydrateExisting();
        filterToSelectedTerm();
        applyTextFilter();
      });
  }

  // Re-filter whenever Term changes
  if (termSelect){
    termSelect.addEventListener('change', ()=>{
      // Update all visible badges
      document.querySelectorAll('.term-badge').forEach(el => el.textContent = currentTerm() || 'Term not set');
      filterToSelectedTerm();
      applyTextFilter();
    });
  }
})();