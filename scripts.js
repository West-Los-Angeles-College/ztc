/* scripts.js — builds ZTC course table from ztc_live.csv and wires Add buttons to shared cart (localStorage) */
(function(){
  const STORAGE_KEY = 'wlacZtcCartV1';
  const $ = (s, c=document)=>c.querySelector(s);
  const $$ = (s, c=document)=>Array.from(c.querySelectorAll(s));

  const table = $('#courseTable');
  const tbody = table ? table.querySelector('tbody') : null;
  const searchInput = $('#search');
  if (!table || !tbody) return;

  const loadCart = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; } };
  const saveCart = (items) => localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  const addToCart = (item) => { const items = loadCart(); items.push(item); saveCart(items); };
  const inCart = (course, section) => loadCart().some(i => i.course===course && i.section===section);

  async function loadCSV(path){
    const res = await fetch(path);
    if(!res.ok) throw new Error('Failed to fetch ' + path);
    const text = await res.text();
    return parseCSV(text);
  }
  function parseCSV(text){
    const rows = [];
    const lines = text.split(/\r?\n/).filter(l => l.length);
    for(const line of lines){
      const out = []; let cur=''; let q=false;
      for(let i=0;i<line.length;i++){
        const ch=line[i], nxt=line[i+1];
        if(ch==='"'){
          if(q && nxt==='"'){ cur+='"'; i++; } else { q=!q; }
        }else if(ch===',' && !q){ out.push(cur); cur=''; }
        else{ cur+=ch; }
      }
      out.push(cur);
      rows.push(out.map(s=>s.trim()));
    }
    return rows;
  }

  function rowToObject(headers, row){
    const obj = {}; headers.forEach((h,i)=> obj[h] = row[i] ?? ''); return obj;
  }

  function buildTable(headers, rows){
    if (!headers || headers.length < 1){ headers = ['Course','Section','Instructor','Units','Days','Time','Location']; }
    const thead = table.tHead || table.createTHead(); thead.innerHTML = '';
    const trh = document.createElement('tr');
    headers.forEach(h=>{ const th=document.createElement('th'); th.textContent=h; trh.appendChild(th); });
    const thAdd = document.createElement('th'); thAdd.textContent = 'Add'; trh.appendChild(thAdd); thead.appendChild(trh);
    tbody.innerHTML='';
    for(const row of rows){
      const obj = rowToObject(headers, row);
      const tr = document.createElement('tr');
      headers.forEach(h=>{ const td=document.createElement('td'); td.textContent = obj[h] || ''; tr.appendChild(td); });
      const tdBtn=document.createElement('td');
      const btn=document.createElement('button'); btn.type='button';
      const wasAdded = inCart(obj.Course, obj.Section);
      btn.textContent = wasAdded ? 'Added' : 'Add'; btn.disabled = wasAdded;
      btn.addEventListener('click', ()=>{
        addToCart({ course: obj.Course||'', term: obj.Term||'', section: obj.Section||'', instructor: obj.Instructor||'', units: obj.Units||'', days: obj.Days||'', time: obj.Time||'', location: obj.Location||'' });
        btn.textContent='Added'; btn.disabled=true;
      });
      tdBtn.appendChild(btn); tr.appendChild(tdBtn); tbody.appendChild(tr);
    }
  }

  function applyFilter(term){
    const t = (term||'').toLowerCase();
    $$('#courseTable tbody tr').forEach(tr=>{ tr.style.display = tr.textContent.toLowerCase().includes(t) ? '' : 'none'; });
  }

  if(searchInput){ searchInput.addEventListener('input', e=> applyFilter(e.target.value)); }

  loadCSV('ztc_live.csv').then(rows=>{
    const [headers, ...data] = rows; buildTable(headers, data);
  }).catch(err=>{
    console.warn('CSV load failed; hydrating existing table. Reason:', err);
    const headCells = $$('#courseTable thead th').map(th=>th.textContent.trim());
    const headers = headCells.length ? headCells : ['Course','Section','Instructor','Units','Days','Time','Location'];
    const theadRow = $('#courseTable thead tr');
    if (theadRow && (headCells[headCells.length-1] !== 'Add')){ const th = document.createElement('th'); th.textContent='Add'; theadRow.appendChild(th); }
    $$('#courseTable tbody tr').forEach(tr=>{
      const cells = Array.from(tr.querySelectorAll('td')).map(td=>td.textContent.trim());
      const obj = rowToObject(headers, cells);
      const tdBtn = document.createElement('td'); const btn = document.createElement('button'); btn.type='button';
      const wasAdded = inCart(obj.Course, obj.Section);
      btn.textContent = wasAdded ? 'Added' : 'Add'; btn.disabled = wasAdded;
      btn.addEventListener('click', ()=>{
        addToCart({ course: obj.Course||'', term: obj.Term||'', section: obj.Section||'', instructor: obj.Instructor||'', units: obj.Units||'', days: obj.Days||'', time: obj.Time||'', location: obj.Location||'' });
        btn.textContent='Added'; btn.disabled=true;
      });
      tdBtn.appendChild(btn); tr.appendChild(tdBtn);
    });
  });
})();
