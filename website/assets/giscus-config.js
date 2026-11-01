// Renegade Reader - Giscus Community Comments Configuration & Loader
window.GISCUS_CONFIG = {
  repo: 'EtherealInsanity/Renegade',
  repoId: 'R_kgDOVexrEw',
  category: 'General',
  categoryId: 'DIC_kwDOVexrE84DKIb8',
  mapping: 'specific',
  reactionsEnabled: '1',
  emitMetadata: '0',
  inputPosition: 'top',
  lang: 'en'
};

function getGiscusTheme(isLight) {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocal) {
    return isLight ? 'noborder_light' : 'transparent_dark';
  }
  // Host custom CSS on production origins
  const origin = window.location.origin;
  return `${origin}/assets/giscus.css`;
}

window.loadGiscus = function(container, term) {
  if (!container || container.getAttribute('data-giscus-loaded')) return;
  container.setAttribute('data-giscus-loaded', 'true');

  const curTheme = document.documentElement.getAttribute('data-theme') || '';
  const isLight = curTheme === 'bamboo' || curTheme === 'medicine-pavilion';

  const script = document.createElement('script');
  script.src = 'https://giscus.app/client.js';
  script.setAttribute('data-repo', window.GISCUS_CONFIG.repo);
  script.setAttribute('data-repo-id', window.GISCUS_CONFIG.repoId);
  script.setAttribute('data-category', window.GISCUS_CONFIG.category);
  script.setAttribute('data-category-id', window.GISCUS_CONFIG.categoryId);
  script.setAttribute('data-mapping', 'specific');
  script.setAttribute('data-term', term);
  script.setAttribute('data-reactions-enabled', window.GISCUS_CONFIG.reactionsEnabled);
  script.setAttribute('data-emit-metadata', window.GISCUS_CONFIG.emitMetadata);
  script.setAttribute('data-input-position', window.GISCUS_CONFIG.inputPosition);
  script.setAttribute('data-theme', getGiscusTheme(isLight));
  script.setAttribute('data-lang', window.GISCUS_CONFIG.lang);
  script.crossOrigin = 'anonymous';
  script.async = true;

  const skeleton = container.querySelector('.giscus-skeleton');
  if (skeleton) {
    script.onload = () => {
      skeleton.style.display = 'none';
    };
  }

  container.appendChild(script);
};

window.updateGiscusTheme = function(themeName) {
  const isLight = themeName === 'bamboo' || themeName === 'medicine-pavilion';
  const iframe = document.querySelector('iframe.giscus-frame');
  if (!iframe) return;

  const targetTheme = getGiscusTheme(isLight);
  iframe.contentWindow.postMessage(
    { giscus: { setConfig: { theme: targetTheme } } },
    'https://giscus.app'
  );
};
