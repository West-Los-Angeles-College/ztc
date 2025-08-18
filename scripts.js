/* scripts.js — WLAC ZTC Search + Cart wiring
   - Loads ztc_live.csv and renders the course table
   - Adds an “Add” button per row and writes full details to localStorage
   - Shows a Term pill under the Add button and injects the selected Term
   - Auto-filters rows by the selected Term (if a #termSelect exists)
*/
(function(){
  const STORAGE_KEY = 'wlacZtcCartV1';
  const $  = (s, c=document)=>c.querySelector(s);
  const $$ = (s, c=document)=>Array.from(c.querySelectorAll(s));

  // ----------------- Cart primitives -----------------
  function loadCart(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; } }
  function saveCart(items){ localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
  function inCart(course, section){ return loadCart().some(i => i.course===course && i.section===section); }

  // Expose a minimal API other pages can use if needed
  if (!window.WLAC_ZTC_CART){
    window.WLAC_ZTC_CART = {
      add: (item)=>{ const arr=loadCart(); arr.push(item); saveCart(arr); },
      list: ()=> loadCart(),
      clear: ()=> saveCart([])
    };
  }

  // ----------------- Term helpers -----------------
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
  function applyTermFilter(){
    const selTerm = currentTerm();
    if (!selTerm) { // Show all if none selected
      $$('#ztcTable tbody tr, #courseTable tbody tr').forEach(tr => tr.style.display = '');
      return;
    }
    $$('#ztcTable tbody tr, #courseTable tbody tr').forEach(tr => {
      const rowTerm = (tr.getAttribute('data-term')||'').toLowerCase();
      tr.style.display = rowTerm === selTerm.toLowerCase() ? '' : 'none';
    });
  }

  // ----------------- CSV loader -----------------
  async function fetchCSV(path){
    const res = await fetch(path, { cache: 'no-store' });
    if(!res.ok) throw new Error('CSV fetch failed: '+res.status);
    const text = await res.text();
    return parseCSV(text);
  }
  function parseCSV(text){
    const out = [];
    const lines = text.split(/\r?\n/).filter(l => l.trim().length);
    for (const line of lines){
      let cur = '', q = false; const row = [];
      for (let i=0;i<line.length;i++){
        const ch=line[i], nx=line[i+1];
        if(ch==='"'){ if(q && nx==='"'){ cur+='"'; i++; } else { q=!q; } }
        else if(ch===',' && !q){ row.push(cur); cur=''; }
        else { cur+=ch; }
      }
      row.push(cur);
      out.push(row.map(s=>s.trim()));
    }
    return out;
  }

  // ----------------- Build table -----------------
  const table = $('#ztcTable') || $('#courseTable');
  const tbody = table ? (table.tBodies[0] || table.createTBody()) : null;

  function rowObj(headers, row){
    const o={}; headers.forEach((h,i)=> o[h]= (row[i]??'').trim()); return o;
  }

  function buildTable(headers, rows){
    // Normalize header casing
    headers = headers.map(h=>h.trim());
    // Expected header titles
    const expected = ['Course','Term','Section','Instructor','Units','Days','Time','Location'];

    // If headers differ (e.g., uppercase), map to expected slots by best-effort matching
    const mapIdx = {};
    expected.forEach(exp=>{
      const i = headers.findIndex(h => h.toLowerCase() === exp.toLowerCase());
      mapIdx[exp] = i >= 0 ? i : -1;
    });

    // Build thead with Add column if missing
    let thead = table.tHead || table.createTHead();
    thead.innerHTML = '';
    const thr = document.createElement('tr');
    expected.forEach(h=>{
      const th=document.createElement('th'); th.textContent=h; thr.appendChild(th);
    });
    const thAdd = document.createElement('th'); thAdd.textContent = 'Add'; thr.appendChild(thAdd);
    thead.appendChild(thr);

    // Body
    tbody.innerHTML='';
    rows.forEach(r=>{
      const obj = {};
      expected.forEach(h=>{
        const idx = mapIdx[h];
        obj[h] = idx>=0 ? r[idx] : '';
      });

      const tr = document.createElement('tr');
      tr.setAttribute('data-term', obj.Term || '');

      expected.forEach(h=>{
        const td = document.createElement('td');
        td.textContent = obj[h] || '';
        tr.appendChild(td);
      });

      const tdBtn = document.createElement('td');
      tdBtn.className = 'add-cell';
      const btn = document.createElement('button');
      btn.type='button';
      btn.textContent = inCart(obj.Course, obj.Section) ? 'Added' : 'Add';
      btn.disabled = inCart(obj.Course, obj.Section);
      btn.addEventListener('click', ()=>{
        const payload = {
          course:     obj.Course || '',
          term:       (currentTerm() || obj.Term || ''),
          section:    obj.Section || '',
          instructor: obj.Instructor || '',
          units:      obj.Units || '',
          days:       obj.Days || '',
          time:       obj.Time || '',
          location:   obj.Location || ''
        };
        if (window.WLAC_ZTC_CART && typeof WLAC_ZTC_CART.add==='function'){
          WLAC_ZTC_CART.add(payload);
        } else {
          const arr = loadCart(); arr.push(payload); saveCart(arr);
        }
        btn.textContent='Added'; btn.disabled=true;
        document.dispatchEvent(new Event('wlac-cart-updated'));
      });
      tdBtn.appendChild(btn);

      // Term badge
      const badge = makeTermBadge();
      tdBtn.appendChild(badge);

      tr.appendChild(tdBtn);
      tbody.appendChild(tr);
    });

    applyTermFilter();
  }

  function hydrateExisting(){
    // If table already present in DOM, just add Add buttons
    const head = $$('#ztcTable thead th, #courseTable thead th').map(th=>th.textContent.trim());
    const expected = ['Course','Term','Section','Instructor','Units','Days','Time','Location'];
    const headers = head.length ? head.slice(0, expected.length) : expected;

    // Ensure Add header
    const thr = $('#ztcTable thead tr, #courseTable thead tr');
    if (thr && (!thr.lastElementChild || thr.lastElementChild.textContent.trim()!=='Add')){
      const th=document.createElement('th'); th.textContent='Add'; thr.appendChild(th);
    }

    $$('#ztcTable tbody tr, #courseTable tbody tr').forEach(tr=>{
      const cells = $$('td', tr).map(td=>td.textContent.trim());
      const obj = rowObj(headers, cells);
      tr.setAttribute('data-term', obj.Term || '');

      const tdBtn = document.createElement('td');
      tdBtn.className='add-cell';

      const btn = document.createElement('button');
      btn.type='button';
      btn.textContent = inCart(obj.Course, obj.Section) ? 'Added' : 'Add';
      btn.disabled = inCart(obj.Course, obj.Section);
      btn.addEventListener('click', ()=>{
        const payload = {
          course:     obj.Course || '',
          term:       (currentTerm() || obj.Term || ''),
          section:    obj.Section || '',
          instructor: obj.Instructor || '',
          units:      obj.Units || '',
          days:       obj.Days || '',
          time:       obj.Time || '',
          location:   obj.Location || ''
        };
        if (window.WLAC_ZTC_CART && typeof WLAC_ZTC_CART.add==='function'){
          WLAC_ZTC_CART.add(payload);
        } else {
          const arr = loadCart(); arr.push(payload); saveCart(arr);
        }
        btn.textContent='Added'; btn.disabled=true;
        document.dispatchEvent(new Event('wlac-cart-updated'));
      });

      tdBtn.appendChild(btn);
      tdBtn.appendChild(makeTermBadge());
      tr.appendChild(tdBtn);
    });

    applyTermFilter();
  }

  // ----------------- Search filter -----------------
  const searchInput = $('#search');
  if (searchInput){
    searchInput.addEventListener('input', e=>{
      const q = (e.target.value || '').toLowerCase();
      $$('#ztcTable tbody tr, #courseTable tbody tr').forEach(tr=>{
        tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
      // re-apply term filter on top of text filter
      applyTermFilter();
    });
  }

  // ----------------- Init -----------------
  if (table && tbody){
    fetchCSV('ztc_live.csv')
      .then(rows => {
        if (!rows.length) throw new Error('Empty CSV');
        const [headers, ...data] = rows;
        buildTable(headers, data);
      })
      .catch(()=>{
        // Fallback to hydrating existing DOM table
        hydrateExisting();
      });
  }

  const termSelect = document.getElementById('termSelect');
  if (termSelect){
    termSelect.addEventListener('change', ()=>{
      // update all term badges
      document.querySelectorAll('.term-badge').forEach(el => el.textContent = currentTerm() || '');
      applyTermFilter();
    });
  }
})();