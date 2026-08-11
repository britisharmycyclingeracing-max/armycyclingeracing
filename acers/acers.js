const ACERS_SERIES = [
  { id: 'aut25', label: 'Autumn 2025', type: 'series', season: '2025/26' },
  { id: 'wint26', label: 'Winter 2026', type: 'series', season: '2025/26' },
  { id: 'champ2526', label: 'Championship 2025/26', type: 'championship', season: '2025/26' }
];

function getSeriesId() {
  const raw = new URLSearchParams(location.search).get('series') || 'aut25';
  const normalized = String(raw).toLowerCase().replace(/[^a-z0-9]/g, '');
  const aliases = { autumn2025:'aut25', autumn25:'aut25', aut25:'aut25', winter2026:'wint26', winter26:'wint26', wint26:'wint26', championship2526:'champ2526', championship202526:'champ2526', champ2526:'champ2526', champ25:'champ2526' };
  const id = aliases[normalized] || normalized;
  return ACERS_SERIES.some(s => s.id === id) ? id : 'aut25';
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
  el.innerHTML=ACERS_SERIES.map(s=>`<a class="series-switch${s.id===activeId?' active':''}${s.type==='championship'?' championship':''}" href="?series=${encodeURIComponent(s.id)}"><small>${s.type==='championship'?'CHAMPIONSHIP':'SERIES'}</small><strong>${esc(s.label)}</strong></a>`).join('');
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
