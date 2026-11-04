// Renegade Reader - Waline Comments Configuration & Dynamic Loader
window.WALINE_CONFIG = {
  serverURL: 'https://waline-on-worker.anc1ent-0.workers.dev',
  lang: 'en',
  reaction: false,
  pageview: true,
  commentSorting: 'latest',
  locale: {
    placeholder: 'Write a comment...',
    admin: 'Heavenly Dao'
  }
};

function injectWalineStyles() {
  if (!document.getElementById('waline-base-css')) {
    const baseLink = document.createElement('link');
    baseLink.id = 'waline-base-css';
    baseLink.rel = 'stylesheet';
    baseLink.href = 'https://unpkg.com/@waline/client@v3/dist/waline.css';
    document.head.appendChild(baseLink);
  }

  if (!document.getElementById('waline-custom-css')) {
    const customLink = document.createElement('link');
    customLink.id = 'waline-custom-css';
    customLink.rel = 'stylesheet';
    const isSubdir = window.location.pathname.includes('/read/') || window.location.pathname.includes('/chapters/');
    customLink.href = isSubdir ? '../assets/waline.css' : 'assets/waline.css';
    document.head.appendChild(customLink);
  }
}

window.loadWaline = async function(container, customPath) {
  if (!container || container.getAttribute('data-waline-loaded')) return;
  container.setAttribute('data-waline-loaded', 'true');

  injectWalineStyles();

  const serverURL = (window.WALINE_CONFIG.serverURL || '').trim();
  const skeleton = container.querySelector('.waline-skeleton, .giscus-skeleton');

  // If serverURL hasn't been set yet, show friendly setup instructions card
  if (!serverURL || serverURL === 'YOUR_WALINE_SERVER_URL') {
    if (skeleton) skeleton.style.display = 'none';
    const notice = document.createElement('div');
    notice.className = 'waline-notice-card';
    notice.innerHTML = `
      <div style="font-size: 2rem; margin-bottom: 0.5rem;">💬</div>
      <h4>Comments</h4>
      <p>Please configure your <code>serverURL</code> in <code>website/assets/waline-config.js</code> to view comments.</p>
    `;
    container.appendChild(notice);
    return;
  }

  try {
    const { init } = await import('https://unpkg.com/@waline/client@v3/dist/waline.js');
    if (skeleton) skeleton.style.display = 'none';

    const targetPath = customPath || container.getAttribute('data-path') || window.location.pathname;

    window.walineApp = init({
      el: container,
      serverURL: serverURL,
      path: targetPath,
      lang: window.WALINE_CONFIG.lang || 'en',
      reaction: window.WALINE_CONFIG.reaction ?? false,
      pageview: window.WALINE_CONFIG.pageview ?? true,
      commentSorting: window.WALINE_CONFIG.commentSorting || 'latest',
      dark: 'html:not([data-theme="bamboo"]):not([data-theme="medicine-pavilion"])',
      emoji: [
        'https://unpkg.com/@waline/emojis@1.2.0/tw-emoji',
      ],
      locale: window.WALINE_CONFIG.locale || {}
    });
  } catch (err) {
    console.error('Failed to initialize Waline comments:', err);
    if (skeleton) {
      skeleton.innerHTML = '<span style="color: var(--accent-color);">Failed to load discussions. Please check connection.</span>';
    }
  }
};

// Backwards compatibility alias for existing static chapter pages
window.loadGiscus = function(container, term) {
  window.loadWaline(container, term);
};
window.updateGiscusTheme = function() {
  // Waline handles dark mode selector automatically
};
