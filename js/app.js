(() => {
  const STATE = { data: [], map: null, table: null, markers: {} };

  /* ---------- Data load ---------- */
  fetch('data/cases.json')
    .then(r => r.json())
    .then(json => { STATE.data = json; initMap(); initTable(); wireInteractions(); });

  /* ---------- Helpers ---------- */
  const climateColor = code => ({
    A:'#2E86AB', B:'#F4A261', C:'#2A9D8F', D:'#E76F51', E:'#6C5CE7'
  })[code[0]] || '#888';

  const icon = code => L.divIcon({
    html:`<div style="background:${climateColor(code)};width:14px;height:14px;border-radius:50%"></div>`,
    className:'climate-icon', iconSize:[14,14]
  });

  /* ---------- Map ---------- */
  function initMap() {
    STATE.map = L.map('map').setView([20,0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { attribution:'© OpenStreetMap contributors'}).addTo(STATE.map);

    STATE.data.forEach(c => {
      const m = L.marker([c.lat, c.lon], { icon: icon(c.climate) }).addTo(STATE.map);
      m.bindPopup(`
        <strong>${c.title}</strong><br>${c.city} · ${c.climate}<br>${c.summary}<br>
        <a href="#" class="popup-link" data-id="${c.id}">View details</a>
      `);
      STATE.markers[c.id] = m;
    });

    STATE.map.on('popupopen', e => {
      e.popup._contentNode.querySelectorAll('.popup-link').forEach(a => {
        a.addEventListener('click', ev => {
          ev.preventDefault();
          focusRow(ev.target.dataset.id);
          e.popup._close();
        });
      });
    });
  }

  /* ---------- Table ---------- */
  function initTable() {
    const cols = ['title','city','climate','year','actions',
                  'effectiveness','cost','sources'];

    const header = '<thead><tr>' + cols.map(c => `<th>${c}</th>`).join('') + '</tr></thead>';
    const body = STATE.data.map(c => {
      const eff = Object.entries(c.effectiveness || {})
                        .map(([k,v]) => `${k}: ${v}`).join('; ');
      const cost = c.cost ? `${c.currency||''} ${c.cost.toLocaleString()}` : '';
      const srcs = (c.sources||[])
                   .map(s => `<a href="${s.url}" target="_blank">link</a>`).join(', ');
      return `
        <tr data-id="${c.id}">
          <td>${c.title}</td><td>${c.city}</td><td>${c.climate}</td>
          <td>${c.year}</td><td>${(c.actions||[]).join(', ')}</td>
          <td>${eff}</td><td>${cost}</td><td>${srcs}</td>
        </tr>`;
    }).join('');

    const tableEl = document.getElementById('cases');
    tableEl.innerHTML = header + '<tbody>' + body + '</tbody>';

    STATE.table = new DataTable('#cases', {
      paging:false, searching:true, info:false, scrollY:'30vh'
    });
  }

  /* ---------- Cross-link ---------- */
  function wireInteractions() {
    const tableEl = document.getElementById('cases');

    const addRowListeners = () => {
      tableEl.querySelectorAll('tbody tr').forEach(tr => {
        tr.addEventListener('click', () => focusMarker(tr.dataset.id));
      });
    };
    addRowListeners();
    STATE.table.on('draw', addRowListeners); // re-attach after table redraw
  }

  function focusMarker(id) {
    const m = STATE.markers[id];
    if (!m) return;
    STATE.map.setView(m.getLatLng(), 8, { animate:true });
    m.openPopup();
    focusRow(id);
  }

  function focusRow(id) {
    const rows = document.querySelectorAll('#cases tbody tr');
    rows.forEach(r => r.classList.toggle('selected', r.dataset.id === id));
    const row = document.querySelector(`#cases tbody tr[data-id="${id}"]`);
    if (row) row.scrollIntoView({ behavior:'smooth', block:'center' });
  }
})();
