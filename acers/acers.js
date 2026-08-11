const ACERS_DATA_URL = './data/autumn-2025.json';

async function loadAcersData() {
  const response = await fetch(ACERS_DATA_URL, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Unable to load ACeRS data (${response.status})`);
  return response.json();
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
