// Renegade Reader - Waline Comments Configuration & Dynamic Loader
window.WALINE_CONFIG = {
  serverURL: 'https://waline-on-worker.anc1ent-0.workers.dev',
  lang: 'en',
  reaction: false,
  pageview: true,
  commentSorting: 'latest',
  search: false,
  imageUploader: false,
  copyright: false,
  locale: {
    placeholder: 'Write a comment...',
    admin: 'Heavenly Dao'
  }
};

// Optimization: Preconnect to Waline backend and unpkg CDN early to cut network latency
(function preconnectCommentServices() {
  const domains = [
    'https://waline-on-worker.anc1ent-0.workers.dev',
    'https://unpkg.com'
  ];
  domains.forEach(href => {
    if (!document.querySelector(`link[rel="preconnect"][href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = href;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
  });
})();

// Intercept Waline API responses:
// 1. Instantly display new comments without refresh by stripping SQL null `rid`/`pid` from POST responses.
//    (Waline v3 has a bug where `'rid' in data` evaluates true when rid is null, discarding root comments until refresh).
// 2. Strip client device/OS and IP address metadata from responses for privacy.
(function interceptWalineComments() {
  if (window._walineInterceptorInstalled) return;
  window._walineInterceptorInstalled = true;

  const originalFetch = window.fetch;
  window.fetch = async function(input, init) {
    const url = typeof input === 'string' ? input : (input && input.url ? input.url : '');
    const method = (init && init.method ? init.method : (input && input.method ? input.method : 'GET')).toUpperCase();

    if (url.includes('/api/comment')) {
      const response = await originalFetch.apply(this, arguments);
      try {
        const clone = response.clone();
        const json = await clone.json();

        function sanitizeComment(item) {
          if (!item || typeof item !== 'object') return;
          delete item.browser;
          delete item.os;
          delete item.addr;
          if (item.id && !item.objectId) item.objectId = item.id;
          if (item.objectId && !item.id) item.id = item.objectId;
          if (item.rid === null || item.rid === undefined) delete item.rid;
          if (item.pid === null || item.pid === undefined) delete item.pid;
          if (Array.isArray(item.children)) {
            item.children.forEach(sanitizeComment);
          }
        }

        if (json && json.data) {
          if (method === 'POST') {
            // Root comments must not have 'rid' or 'pid' property if null, so Waline client immediately unshifts to reactive list
            sanitizeComment(json.data);
          } else {
            // GET comment lists / recent comments
            if (Array.isArray(json.data.data)) {
              json.data.data.forEach(sanitizeComment);
            } else if (Array.isArray(json.data)) {
              json.data.forEach(sanitizeComment);
            }
          }

          const headers = new Headers(response.headers);
          headers.delete('content-length');
          return new Response(JSON.stringify(json), {
            status: response.status,
            statusText: response.statusText,
            headers: headers
          });
        }
      } catch (err) {
        // Fallback to normal response on any parse error
      }
      return response;
    }

    return originalFetch.apply(this, arguments);
  };
})();

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
      search: false,
      imageUploader: false,
      copyright: false,
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
