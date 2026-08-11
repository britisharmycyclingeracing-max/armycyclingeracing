async function fetchJson(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (data && data.ok === false) throw new Error(data.error || 'ACeRS API returned an error');
  return data;
}

async function loadAcersData() {
  // Prefer the live ACeRS Apps Script API when configured.
  if (typeof ACERS_API_BASE !== 'undefined' && ACERS_API_BASE) {
    try {
      const url = new URL(ACERS_API_BASE);
      url.searchParams.set('api', 'archive');
      url.searchParams.set('series', 'autumn-2025');
      const live = await fetchJson(url.toString());
      live._source = 'live';
      return live;
    } catch (error) {
      console.warn('ACeRS live API unavailable; using static archive.', error);
    }
  }

  const fallback = (typeof ACERS_STATIC_FALLBACK !== 'undefined' && ACERS_STATIC_FALLBACK)
    ? ACERS_STATIC_FALLBACK
    : './data/autumn-2025.json';
  const data = await fetchJson(fallback);
  data._source = 'static';
  return data;
}

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatExcelDuration(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'string') return value;
  const seconds = Math.round(Number(value) * 86400);
  if (!Number.isFinite(seconds)) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function verifiedBadge(verified) {
  return verified
    ? '<span class="verify-badge verified">✓ Verified</span>'
    : '<span class="verify-badge unverified">Not verified</span>';
}

function findRider(data, zwiftId) {
  return data.riders.find(r => String(r.zwiftId) === String(zwiftId));
}

function standingsForRider(data, zwiftId) {
  const result = {};
  ['points', 'sprint', 'kom', 'gc'].forEach(key => {
    result[key] = data.standings[key].find(r => String(r.zwiftId) === String(zwiftId)) || null;
  });
  return result;
}
