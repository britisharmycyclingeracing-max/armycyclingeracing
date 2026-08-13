const ACERS_SERIES = [
  { id: 'aut26', label: 'Autumn 2026', type: 'series', season: '2026/27', current: true },
  { id: 'aut25', label: 'Autumn 2025', type: 'series', season: '2025/26' },
  { id: 'wint26', label: 'Winter 2026', type: 'series', season: '2025/26' },
  { id: 'champ2526', label: 'Championship 2025/26', type: 'championship', season: '2025/26' }
];

function getSeriesId() {
  const raw = new URLSearchParams(location.search).get('series') || 'aut26';
  const normalized = String(raw).toLowerCase().replace(/[^a-z0-9]/g, '');
  const aliases = { autumn2026:'aut26', autumn26:'aut26', aut26:'aut26', autumn2025:'aut25', autumn25:'aut25', aut25:'aut25', winter2026:'wint26', winter26:'wint26', wint26:'wint26', championship2526:'champ2526', championship202526:'champ2526', champ2526:'champ2526', champ25:'champ2526' };
  const id = aliases[normalized] || normalized;
  return ACERS_SERIES.some(s => s.id === id) ? id : 'aut26';
}

function currentSeriesConfig() { return ACERS_SERIES.find(s => s.id === getSeriesId()) || ACERS_SERIES[0]; }
function seriesUrl(path, id = getSeriesId(), extra = {}) {
  const url = new URL(path, location.href);
  url.searchParams.set('series', id);
  Object.entries(extra).forEach(([k,v]) => { if (v !== null && v !== undefined && v !== '') url.searchParams.set(k, v); });
  return url.pathname.split('/').pop() + '?' + url.searchParams.toString();
}
function profileUrl(id, series = getSeriesId()) { return `./profile.html?id=${encodeURIComponent(id)}&series=${encodeURIComponent(series)}`; }
function resultsUrl(series = getSeriesId(), race = '') { return `./results.html?series=${encodeURIComponent(series)}${race ? `&race=${encodeURIComponent(race)}` : ''}`; }
function standingsUrl(series = getSeriesId()) { return `./standings.html?series=${encodeURIComponent(series)}`; }

async function fetchJson(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (data && data.ok === false) throw new Error(data.error || 'ACeRS API returned an error');
  return data;
}

async function loadAcersData(seriesId = getSeriesId()) {
  if (typeof ACERS_API_BASE !== 'undefined' && ACERS_API_BASE) {
    try {
      const url = new URL(ACERS_API_BASE);
      url.searchParams.set('api', 'archive');
      url.searchParams.set('series', seriesId);
      const live = await fetchJson(url.toString());
      live._source = 'live';
      return live;
    } catch (error) {
      console.warn('ACeRS live API unavailable.', error);
      if (seriesId !== 'aut25') throw error;
    }
  }
  if (seriesId !== 'aut25') throw new Error('Live API unavailable for this competition.');
  const fallback = (typeof ACERS_STATIC_FALLBACK !== 'undefined' && ACERS_STATIC_FALLBACK) ? ACERS_STATIC_FALLBACK : './data/autumn-2025.json';
  const data = await fetchJson(fallback); data._source = 'static'; return data;
}

function esc(value) { return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }
function formatExcelDuration(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'string') return value;
  const seconds = Math.round(Number(value) * 86400); if (!Number.isFinite(seconds)) return '—';
  const h=Math.floor(seconds/3600),m=Math.floor((seconds%3600)/60),s=seconds%60;
  return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
function verifiedBadge(verified) { return verified ? '<span class="verify-badge verified">✓ Verified</span>' : '<span class="verify-badge unverified">Not verified</span>'; }
function findRider(data, zwiftId) { return (data.riders || []).find(r => String(r.zwiftId) === String(zwiftId)); }
function standingsForRider(data, zwiftId) { const result={}; ['points','sprint','kom','gc'].forEach(k => result[k]=(data.standings[k]||[]).find(r=>String(r.zwiftId)===String(zwiftId))||null); return result; }
function competitionLabel(meta) { return meta.type === 'championship' ? 'Championship' : 'Series'; }
function standingsLabel(meta) { return meta.standingsLabel || (meta.type === 'championship' ? 'Championship Standings' : 'Series Standings'); }

function renderSeriesSelector(containerId, activeId = getSeriesId()) {
  const el=document.getElementById(containerId); if(!el)return;
  el.innerHTML=ACERS_SERIES.map(s=>`<a class="series-switch${s.id===activeId?' active':''}${s.type==='championship'?' championship':''}${s.current?' current':''}" href="?series=${encodeURIComponent(s.id)}"><small>${s.current?'CURRENT SERIES':(s.type==='championship'?'CHAMPIONSHIP':'SERIES')}</small><strong>${esc(s.label)}</strong></a>`).join('');
}
function updateSeriesNav(seriesId=getSeriesId()) {
  document.querySelectorAll('[data-series-link]').forEach(a=>{
    const page=a.getAttribute('data-series-link');
    a.href=`./${page}.html?series=${encodeURIComponent(seriesId)}`;
  });
}


/* Corps jersey display */
const CORPS_JERSEY_MAP = {
  'AAC': 'AAC.png',
  'AGC': 'AGC.png',
  'AMS': 'AMS.png',
  'RAMS': 'AMS.png',
  'RAMS- DENTAL': 'AMS.png',
  'RAMS - DENTAL': 'AMS.png',
  'INF': 'INFANTRY.png',
  'INFANTRY': 'INFANTRY.png',
  'INT CORPS': 'INT CORPS.png',
  'RA': 'RA.png',
  'RAC': 'RAC.png',
  'RAPTC': 'RAPTC.png',
  'RCAM': 'RCAM.png',
  'RE': 'RE.png',
  'REME': 'REME.png',
  'RLC': 'RLC.png',
  'R SIGNALS': 'R SIGNALS.png',
  'ROYAL SIGNALS': 'R SIGNALS.png',
  'RAF': 'RoyalAirForce2024_thumb.png',
  'ROYAL AIR FORCE': 'RoyalAirForce2024_thumb.png',
  'ROYAL NAVY': 'RoyalNavy2024_thumb.png'
};
function corpsJerseyFile(corps) {
  const key = String(corps || '').trim().toUpperCase().replace(/\s+/g, ' ');
  return CORPS_JERSEY_MAP[key] || '';
}
function corpsJerseyPath(corps) {
  const file = corpsJerseyFile(corps);
  return file ? `../assets/jersey/${encodeURIComponent(file)}` : '';
}
function jerseyImg(corps, className='jersey-thumb') {
  const src = corpsJerseyPath(corps);
  if (!src) return '';
  return `<img class="${esc(className)}" src="${src}" alt="${esc(corps)} cycling jersey" loading="lazy" onerror="this.style.display='none'">`;
}


/* Filtered export helpers */
function downloadCsv(filename, headers, rows) {
  const quote = value => `"${String(value ?? '').replaceAll('"','""')}"`;
  const csv = [headers, ...rows].map(row => row.map(quote).join(',')).join('\r\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
function safeFilePart(value) {
  return String(value || '').trim().replace(/[^a-z0-9]+/gi,'_').replace(/^_+|_+$/g,'') || 'All';
}
function printFilteredReport({ title, subtitle='', filters=[], headers=[], rows=[], jerseyCorps='' }) {
  const jersey = jerseyCorps ? corpsJerseyPath(jerseyCorps) : '';
  const jerseyAbs = jersey ? new URL(jersey, location.href).href : '';
  const filterText = filters.filter(Boolean).join(' • ') || 'No additional filters';
  const generated = new Date().toLocaleString('en-GB', { dateStyle:'medium', timeStyle:'short' });
  const w = window.open('', '_blank');
  if (!w) { alert('Please allow pop-ups to export the PDF/print report.'); return; }
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>
    @page{size:A4 landscape;margin:12mm}body{font-family:Arial,sans-serif;color:#111;margin:0}header{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;border-bottom:3px solid #111;padding-bottom:12px;margin-bottom:16px}h1{font-size:24px;margin:0 0 5px}.sub{font-size:13px;color:#555}.meta{font-size:11px;color:#666;margin-top:6px}.jersey{height:72px;width:auto}table{width:100%;border-collapse:collapse;font-size:10.5px}th{background:#111;color:#fff;text-align:left;padding:7px 6px}td{padding:6px;border-bottom:1px solid #ddd;vertical-align:top}tbody tr:nth-child(even){background:#f6f6f6}.foot{font-size:9px;color:#777;margin-top:12px}@media print{button{display:none}}
  </style></head><body><header><div><div style="font-size:10px;font-weight:700;letter-spacing:.12em">ARMY CYCLING eRACING</div><h1>${esc(title)}</h1><div class="sub">${esc(subtitle)}</div><div class="meta">${esc(filterText)}<br>Generated ${esc(generated)}</div></div>${jerseyAbs ? `<img class="jersey" src="${jerseyAbs}" alt="${esc(jerseyCorps)} jersey">` : ''}</header><table><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table><div class="foot">Exported from Army Cycling eRacing. The report reflects the filters applied at the time of export.</div><script>window.onload=()=>setTimeout(()=>window.print(),250)<\/script></body></html>`);
  w.document.close();
}
