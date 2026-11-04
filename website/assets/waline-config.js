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
    admin: 'Heavenly Dao (Owner)'
  }
};

// Cultivator Hierarchy Resolver
window.getCultivatorRole = function(item) {
  if (!item) return { title: 'Wandering Cultivator', type: 'guest', isOwner: false, color: '#94a3b8' };
  const userId = item.user_id ?? item.id;
  const name = (item.nick || item.display_name || item.author || '').trim();
  const email = (item.mail || item.email || '').toLowerCase();
  const type = (item.type || '').toLowerCase();
  const label = (item.label || '').toLowerCase();

  // 1. Main administrator / Owner: user_id === 1 OR username 'EtherealInsanity' OR email matching owner
  const isOwner = userId === 1 || name.toLowerCase() === 'etherealinsanity' || email.includes('anc1ent.0');
  if (isOwner) {
    return { title: 'Heavenly Dao (Owner)', type: 'owner', isOwner: true, color: '#f59e0b' };
  }

  // 2. Promoted administrators: Guardian
  if (type === 'administrator') {
    return { title: 'Guardian', type: 'guardian', isOwner: false, color: '#a855f7' };
  }

  // 3. Moderators / promoted staff: Elder
  if (type === 'moderator' || label.includes('elder') || label.includes('mod')) {
    return { title: 'Elder', type: 'elder', isOwner: false, color: '#10b981' };
  }

  // 4. Ordinary registered / verified users: Daoist
  if (type && type !== 'guest') {
    return { title: 'Daoist', type: 'daoist', isOwner: false, color: '#38bdf8' };
  }

  // Fallback for named commenters
  if (name && name.toLowerCase() !== 'anonymous' && name !== 'Cultivator') {
    return { title: 'Daoist', type: 'daoist', isOwner: false, color: '#38bdf8' };
  }

  // Unregistered guest
  return { title: 'Wandering Cultivator', type: 'guest', isOwner: false, color: '#94a3b8' };
};

// Comment cache to map card objectId -> comment metadata
window._walineCommentCache = window._walineCommentCache || new Map();

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
// 2. Strip client device/OS and IP address metadata from responses for privacy.
// 3. Populate comment cache for role resolution and interactive profile quick-previews.
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

        function sanitizeAndCacheComment(item) {
          if (!item || typeof item !== 'object') return;
          delete item.browser;
          delete item.os;
          delete item.addr;
          const id = item.objectId || item.id;
          if (id) {
            window._walineCommentCache.set(String(id), item);
          }
          if (item.id && !item.objectId) item.objectId = item.id;
          if (item.objectId && !item.id) item.id = item.objectId;
          if (item.rid === null || item.rid === undefined) delete item.rid;
          if (item.pid === null || item.pid === undefined) delete item.pid;
          if (Array.isArray(item.children)) {
            item.children.forEach(sanitizeAndCacheComment);
          }
        }

        if (json && json.data) {
          if (method === 'POST') {
            sanitizeAndCacheComment(json.data);
          } else {
            if (Array.isArray(json.data.data)) {
              json.data.data.forEach(sanitizeAndCacheComment);
            } else if (Array.isArray(json.data)) {
              json.data.forEach(sanitizeAndCacheComment);
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

// Cultivator Quick-Preview Modal Singleton
function ensureCultivatorPreviewModal() {
  let modalEl = document.getElementById('cultivator-preview-overlay');
  if (modalEl) return modalEl;

  modalEl = document.createElement('div');
  modalEl.id = 'cultivator-preview-overlay';
  modalEl.className = 'cultivator-preview-overlay';
  modalEl.style.display = 'none';
  modalEl.innerHTML = `
    <div class="cultivator-preview-backdrop"></div>
    <div class="cultivator-preview-card" role="dialog" aria-modal="true">
      <button class="cultivator-preview-close" aria-label="Close">&times;</button>
      <div class="cultivator-preview-header">
        <div class="cultivator-preview-avatar-box">
          <div id="preview-avatar-target" class="cultivator-preview-avatar"></div>
        </div>
        <div class="cultivator-preview-meta">
          <h3 id="preview-name-target" class="cultivator-preview-name">Cultivator</h3>
          <div class="cultivator-preview-status-line">
            <span id="preview-dot-target" class="cultivator-preview-dot">●</span>
            <span id="preview-role-target" class="cultivator-preview-role">Daoist</span>
          </div>
        </div>
      </div>
      <div class="cultivator-preview-body">
        <p class="cultivator-preview-desc">Fellow cultivator walking the Heavenly Dao of Renegade Immortal.</p>
      </div>
      <div class="cultivator-preview-footer">
        <a id="preview-profile-link" href="#" class="btn-cultivator-view-profile">
          <span>View Full Cultivator Profile</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
      </div>
    </div>
  `;

  document.body.appendChild(modalEl);

  const closeBtn = modalEl.querySelector('.cultivator-preview-close');
  const backdrop = modalEl.querySelector('.cultivator-preview-backdrop');

  function closeModal() {
    modalEl.classList.remove('active');
    setTimeout(() => { modalEl.style.display = 'none'; }, 200);
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modalEl.classList.contains('active')) {
      closeModal();
    }
  });

  return modalEl;
}

window.showCultivatorPreview = function(data) {
  const modalEl = ensureCultivatorPreviewModal();
  const avatarTarget = modalEl.querySelector('#preview-avatar-target');
  const nameTarget = modalEl.querySelector('#preview-name-target');
  const dotTarget = modalEl.querySelector('#preview-dot-target');
  const roleTarget = modalEl.querySelector('#preview-role-target');
  const linkTarget = modalEl.querySelector('#preview-profile-link');
  const avatarBox = modalEl.querySelector('.cultivator-preview-avatar-box');

  const nick = data.nick || 'Cultivator';
  const role = data.role || window.getCultivatorRole(data);
  const avatarUrl = data.avatar || '';

  if (nameTarget) nameTarget.textContent = nick;
  if (roleTarget) roleTarget.textContent = role.title;
  if (dotTarget) dotTarget.style.color = role.color;

  if (avatarBox) {
    avatarBox.style.setProperty('--role-glow-color', role.color);
  }

  if (avatarTarget) {
    if (avatarUrl) {
      avatarTarget.innerHTML = `<img src="${avatarUrl}" alt="${nick}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
    } else {
      avatarTarget.textContent = (nick[0] || '☯').toUpperCase();
    }
  }

  if (linkTarget) {
    const isSubdir = window.location.pathname.includes('/read/') || window.location.pathname.includes('/chapters/');
    linkTarget.href = `${isSubdir ? '../' : ''}account.html?user=${encodeURIComponent(nick)}`;
  }

  modalEl.style.display = 'flex';
  void modalEl.offsetWidth;
  modalEl.classList.add('active');
};

// Decorate Waline comment cards with cultivator status subtitle and avatar interaction
function enhanceWalineCards(container) {
  if (!container) return;
  const cards = container.querySelectorAll('.wl-card-item');

  cards.forEach(card => {
    // 1. Inject status subtitle below nickname if not already injected
    if (!card.querySelector('.wl-cultivator-status')) {
      const cardId = card.id;
      const cached = window._walineCommentCache.get(String(cardId));
      const nickEl = card.querySelector('.wl-nick');

      if (nickEl) {
        const commentData = cached || {
          nick: nickEl.textContent.trim(),
          type: card.querySelector('.administrator-icon') ? 'administrator' : ''
        };
        const role = window.getCultivatorRole(commentData);

        const statusEl = document.createElement('div');
        statusEl.className = 'wl-cultivator-status';
        statusEl.setAttribute('data-role', role.type);
        statusEl.innerHTML = `
          <span class="wl-status-dot" style="color:${role.color};">●</span>
          <span class="wl-status-label">${role.title}</span>
        `;

        nickEl.parentNode.insertBefore(statusEl, nickEl.nextSibling);
      }
    }

    // 2. Attach avatar click handler for quick-preview
    const userBox = card.querySelector('.wl-user');
    if (userBox && !userBox.getAttribute('data-preview-bound')) {
      userBox.setAttribute('data-preview-bound', 'true');
      userBox.style.cursor = 'pointer';
      userBox.setAttribute('title', 'Click to preview cultivator profile');

      userBox.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const cardId = card.id;
        const cached = window._walineCommentCache.get(String(cardId));
        const nickEl = card.querySelector('.wl-nick');
        const imgEl = card.querySelector('.wl-user-avatar');

        const nick = (cached && cached.nick) ? cached.nick : (nickEl ? nickEl.textContent.trim() : 'Cultivator');
        const avatar = (cached && cached.avatar) ? cached.avatar : (imgEl ? imgEl.src : '');
        const role = window.getCultivatorRole(cached || { nick });

        window.showCultivatorPreview({ nick, avatar, role });
      });
    }
  });
}

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

    // Observe comment cards rendering to attach status subtitle & avatar interaction
    const observer = new MutationObserver(() => {
      enhanceWalineCards(container);
    });
    observer.observe(container, { childList: true, subtree: true });

    // Initial pass in case cards already mounted
    setTimeout(() => enhanceWalineCards(container), 250);
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
