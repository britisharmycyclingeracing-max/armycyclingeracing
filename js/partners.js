// Army Cycling eRacing - shared sponsors/supporters footer
(() => {
  // Capture the script URL while document.currentScript is still available.
  // If we wait until DOMContentLoaded, document.currentScript is null and
  // nested pages (e.g. /acers/) resolve assets relative to the page instead.
  const PARTNERS_SCRIPT_SRC = document.currentScript?.src || '';

  const SPONSORS = ['ABUS.png', 'EVERYWHEN.png', 'FENWICKS.png', 'REED_IN_PARTNERSHIP.png'];
  const SUPPORTERS = ['KALAS.png'];

  function rootUrl() {
    return PARTNERS_SCRIPT_SRC
      ? new URL('../', PARTNERS_SCRIPT_SRC)
      : new URL('/', location.origin);
  }

  function logoUrl(folder, file) {
    return new URL(`assets/${folder}/${encodeURIComponent(file)}`, rootUrl()).href;
  }

  function friendlyName(file) {
    return file
      .replace(/\.[^.]+$/, '')
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function logoGroup(title, folder, files) {
    if (!files.length) return '';
    return `
      <div class="partner-group">
        <div class="partner-label">${title}</div>
        <div class="partner-logos">
          ${files.map(file => `
            <div class="partner-logo-wrap" title="${friendlyName(file)}">
              <img src="${logoUrl(folder,file)}" alt="${friendlyName(file)}" loading="lazy"
                   onerror="this.closest('.partner-logo-wrap').style.display='none'">
            </div>`).join('')}
        </div>
      </div>`;
  }

  function renderPartners() {
    if (!SPONSORS.length && !SUPPORTERS.length) return;
    if (document.querySelector('.partner-strip')) return;

    const section = document.createElement('section');
    section.className = 'partner-strip';
    section.setAttribute('aria-label','Sponsors and supporters');
    section.innerHTML = `
      <div class="partner-strip-inner">
        ${logoGroup('SPONSORS','sponsors',SPONSORS)}
        ${logoGroup('SUPPORTED BY','supporters',SUPPORTERS)}
      </div>`;

    const footer = document.querySelector('.site-footer');
    if (footer) footer.before(section);
    else document.body.appendChild(section);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderPartners);
  } else {
    renderPartners();
  }
})();
