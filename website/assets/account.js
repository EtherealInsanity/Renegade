/* ==========================================================================
   Renegade Reader - Cultivator Account & Profile Engine
   Handles Waline session, comment aggregation, highlights & notes management
   ========================================================================== */

(function () {
  'use strict';

  const STORAGE_KEY_SETTINGS = 'renegade_reader_settings';
  const STORAGE_KEY_LAST_READ = 'renegade_last_read';
  const STORAGE_KEY_HIGHLIGHTS = 'renegade_highlights';
  const TOTAL_CHAPTERS = 2088;

  // Cultivation Realms mapped by chapter progress
  const REALMS = [
    { maxChapter: 50, title: 'Qi Condensation (Early)', icon: '🌱' },
    { maxChapter: 100, title: 'Qi Condensation (Great Circle)', icon: '🌿' },
    { maxChapter: 250, title: 'Foundation Establishment', icon: '🏛️' },
    { maxChapter: 450, title: 'Core Formation', icon: '🔮' },
    { maxChapter: 700, title: 'Nascent Soul', icon: '⚡' },
    { maxChapter: 1050, title: 'Soul Formation (Domain)', icon: '🌊' },
    { maxChapter: 1350, title: 'Soul Transformation', icon: '🌌' },
    { maxChapter: 1650, title: 'Ascendant (Spirit Realm)', icon: '⚔️' },
    { maxChapter: 1850, title: 'Nirvana Shatterer', icon: '🔥' },
    { maxChapter: 2000, title: 'Void Tribulation', icon: '☄️' },
    { maxChapter: 9999, title: 'Heaven Trampling Sovereign', icon: '👑' }
  ];

  function getActiveTheme() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return raw ? JSON.parse(raw).theme || 'slaughter' : 'slaughter';
    } catch (_) {
      return 'slaughter';
    }
  }

  function getWalineUser() {
    try {
      const raw = localStorage.getItem('WALINE_USER');
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function getLastRead() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LAST_READ);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function getHighlights() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_HIGHLIGHTS);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  function saveHighlights(hl) {
    try {
      localStorage.setItem(STORAGE_KEY_HIGHLIGHTS, JSON.stringify(hl));
      if (window.RenegadeHighlights && window.RenegadeHighlights.sync) {
        window.RenegadeHighlights.sync(hl);
      }
    } catch (e) {
      console.error('Failed to save highlights:', e);
    }
  }

  function calculateRealm(lastChapter) {
    const ch = lastChapter || 1;
    for (const r of REALMS) {
      if (ch <= r.maxChapter) return r;
    }
    return REALMS[REALMS.length - 1];
  }

  // State
  let allHighlights = [];
  let userComments = [];
  let activeColorFilter = 'all';
  let activeSearchQuery = '';
  let activeChapterFilter = 'all';

  document.addEventListener('DOMContentLoaded', async () => {
    // Apply current theme
    const theme = getActiveTheme();
    document.documentElement.setAttribute('data-theme', theme);

    const walineUser = getWalineUser();
    const lastRead = getLastRead();
    const urlParams = new URLSearchParams(window.location.search);
    const publicUserParam = urlParams.get('user');

    const isPublicMode = Boolean(publicUserParam && (!walineUser || walineUser.display_name !== publicUserParam));

    renderProfileHeader(walineUser, lastRead, isPublicMode, publicUserParam);
    setupTabs();
    setupFilters();
    setupBackupTools();

    // Load Highlights & Notes
    await loadHighlightsData(isPublicMode, publicUserParam);

    // Load Waline comments & total comment counts
    await loadWalineComments(walineUser, isPublicMode, publicUserParam);

    // Update Resume button in nav
    const resumeBtn = document.getElementById('account-resume-btn');
    if (resumeBtn && lastRead && lastRead.chapter) {
      resumeBtn.href = `read/ch_${lastRead.chapter}.html`;
      resumeBtn.innerHTML = `<span>Resume Ch. ${lastRead.chapter}</span>`;
    }
  });

  function renderProfileHeader(user, lastRead, isPublicMode, publicUsername) {
    const avatarEl = document.getElementById('profile-avatar');
    const nameEl = document.getElementById('profile-name');
    const realmBadgeEl = document.getElementById('profile-realm-badge');
    const statusEl = document.getElementById('profile-status');
    const authActionBtn = document.getElementById('btn-auth-action');

    const currentChapter = lastRead ? lastRead.chapter : 1;
    const realm = calculateRealm(currentChapter);

    if (isPublicMode) {
      if (nameEl) nameEl.textContent = publicUsername;
      if (avatarEl) {
        avatarEl.textContent = (publicUsername[0] || 'C').toUpperCase();
        avatarEl.title = `Cultivator ${publicUsername}`;
      }
      if (statusEl) statusEl.textContent = 'Fellow Cultivator Public Profile';
      if (realmBadgeEl) {
        realmBadgeEl.innerHTML = `${realm.icon} ${realm.title}`;
      }
      if (authActionBtn) authActionBtn.style.display = 'none';
      return;
    }

    if (user && user.token) {
      // Logged in user
      const displayName = user.display_name || user.email || 'Cultivator';
      if (nameEl) nameEl.textContent = displayName;
      if (avatarEl) {
        if (user.avatar) {
          avatarEl.innerHTML = `<img src="${user.avatar}" alt="${displayName}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
        } else {
          avatarEl.textContent = displayName[0].toUpperCase();
        }
      }
      if (statusEl) {
        const role = user.type === 'administrator' ? 'Grand Elder (Admin)' : 'Inner Disciple (Verified Reader)';
        statusEl.textContent = `${role} · ${user.email || ''}`;
      }
      if (realmBadgeEl) {
        realmBadgeEl.innerHTML = `${realm.icon} ${realm.title}`;
      }
      if (authActionBtn) {
        authActionBtn.textContent = 'Sign Out';
        authActionBtn.onclick = (e) => {
          e.preventDefault();
          if (confirm('Sever spiritual connection and sign out of Waline?')) {
            localStorage.removeItem('WALINE_USER');
            window.location.reload();
          }
        };
      }
    } else {
      // Guest reader
      if (nameEl) nameEl.textContent = 'Wandering Cultivator (Guest)';
      if (avatarEl) avatarEl.textContent = '☯️';
      if (statusEl) statusEl.textContent = 'Local Guest · Sign in with Waline to sync across devices & publish profile';
      if (realmBadgeEl) {
        realmBadgeEl.innerHTML = `${realm.icon} ${realm.title}`;
      }
      if (authActionBtn) {
        authActionBtn.textContent = 'Sign In / Register';
        authActionBtn.onclick = (e) => {
          e.preventDefault();
          toggleWalineLoginEmbed();
        };
      }
    }
  }

  function toggleWalineLoginEmbed() {
    const container = document.getElementById('waline-login-container');
    if (!container) return;
    if (container.style.display === 'block') {
      container.style.display = 'none';
      return;
    }
    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (!container.getAttribute('data-loaded')) {
      container.setAttribute('data-loaded', 'true');
      container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h4 style="margin:0;">💬 Sign In via Waline Discussions</h4>
          <button id="close-waline-login" class="icon-btn" style="background:none;border:none;color:var(--text-muted);cursor:pointer;">✕</button>
        </div>
        <p style="font-size:0.88rem; color:var(--text-muted); margin-bottom:16px;">
          Sign in or register below to sync all your enlightenment notes, track total comments, and claim your Cultivator Profile.
        </p>
        <div id="waline-account-thread"></div>
      `;
      container.querySelector('#close-waline-login')?.addEventListener('click', () => {
        container.style.display = 'none';
      });

      if (window.loadWaline) {
        window.loadWaline(container.querySelector('#waline-account-thread'), '/account.html');
      }
    }
  }

  function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-tab');
        tabButtons.forEach(b => b.classList.remove('active'));
        tabPanels.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const activePanel = document.getElementById(targetId);
        if (activePanel) activePanel.classList.add('active');
      });
    });
  }

  async function loadHighlightsData(isPublicMode, publicUsername) {
    let raw = {};
    if (isPublicMode) {
      try {
        const res = await fetch(`/api/highlights?user=${encodeURIComponent(publicUsername)}&public=true`);
        if (res.ok) {
          const json = await res.json();
          raw = json.highlights || {};
        }
      } catch (_) {}
    } else {
      raw = getHighlights();
    }

    allHighlights = Object.values(raw).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    // Also scan local chapter notes (renegade_notes_ch_*)
    if (!isPublicMode) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('renegade_notes_ch_')) {
          const chNum = parseInt(key.replace('renegade_notes_ch_', ''), 10);
          const noteText = localStorage.getItem(key);
          if (noteText && !allHighlights.some(h => h.id === `ch_note_${chNum}`)) {
            allHighlights.push({
              id: `ch_note_${chNum}`,
              chapter: chNum,
              text: `Chapter ${chNum} Cultivator Insights`,
              color: 'gold',
              note: noteText,
              isPublic: true,
              isChapterSummary: true,
              timestamp: Date.now()
            });
          }
        }
      }
    }

    updateStatCounts();
    populateChapterDropdown();
    renderHighlightsList(isPublicMode);
  }

  function updateStatCounts() {
    const hlCountEl = document.getElementById('stat-highlights-count');
    const notesCountEl = document.getElementById('stat-notes-count');
    const readProgressEl = document.getElementById('stat-read-progress');
    const hlTabBadge = document.getElementById('badge-highlights-count');

    const totalHighlights = allHighlights.length;
    const totalNotes = allHighlights.filter(h => h.note && h.note.trim().length > 0).length;

    if (hlCountEl) hlCountEl.textContent = totalHighlights;
    if (notesCountEl) notesCountEl.textContent = totalNotes;
    if (hlTabBadge) hlTabBadge.textContent = totalHighlights;

    const lastRead = getLastRead();
    const ch = lastRead ? lastRead.chapter : 0;
    const pct = Math.min(100, Math.round((ch / TOTAL_CHAPTERS) * 100));
    if (readProgressEl) readProgressEl.textContent = `${pct}%`;

    // Realm progress panel
    const realmFill = document.getElementById('realm-progress-fill');
    const realmLabel = document.getElementById('realm-progress-label');
    if (realmFill) realmFill.style.width = `${pct}%`;
    if (realmLabel) realmLabel.textContent = `Chapter ${ch} of ${TOTAL_CHAPTERS} Cultivated (${pct}%)`;
  }

  function populateChapterDropdown() {
    const select = document.getElementById('filter-chapter-select');
    if (!select) return;

    const chapters = Array.from(new Set(allHighlights.map(h => h.chapter))).sort((a, b) => a - b);
    select.innerHTML = '<option value="all">All Chapters</option>';
    chapters.forEach(ch => {
      const opt = document.createElement('option');
      opt.value = ch;
      opt.textContent = `Chapter ${ch}`;
      select.appendChild(opt);
    });
  }

  function setupFilters() {
    // Search input
    const searchInput = document.getElementById('filter-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        activeSearchQuery = e.target.value.toLowerCase().trim();
        renderHighlightsList();
      });
    }

    // Color chips
    const colorChips = document.querySelectorAll('.color-filter-chip');
    colorChips.forEach(chip => {
      chip.addEventListener('click', () => {
        colorChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeColorFilter = chip.getAttribute('data-color') || 'all';
        renderHighlightsList();
      });
    });

    // Chapter select
    const chapterSelect = document.getElementById('filter-chapter-select');
    if (chapterSelect) {
      chapterSelect.addEventListener('change', (e) => {
        activeChapterFilter = e.target.value;
        renderHighlightsList();
      });
    }
  }

  function renderHighlightsList(isPublicMode = false) {
    const listContainer = document.getElementById('highlights-list-container');
    if (!listContainer) return;

    const filtered = allHighlights.filter(hl => {
      if (isPublicMode && hl.isPublic === false) return false;

      // Color filter
      if (activeColorFilter !== 'all' && hl.color !== activeColorFilter) return false;

      // Chapter filter
      if (activeChapterFilter !== 'all' && String(hl.chapter) !== activeChapterFilter) return false;

      // Search query
      if (activeSearchQuery) {
        const textMatch = hl.text && hl.text.toLowerCase().includes(activeSearchQuery);
        const noteMatch = hl.note && hl.note.toLowerCase().includes(activeSearchQuery);
        if (!textMatch && !noteMatch) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state-card">
          <div class="empty-state-icon">🖋️</div>
          <h4 class="empty-state-title">No highlights found</h4>
          <p class="empty-state-desc">
            ${allHighlights.length === 0 ? 'While reading any chapter, select text to illuminate passages with cultivation colors and record your insight notes!' : 'No highlights match your current search or color filters.'}
          </p>
          ${allHighlights.length === 0 ? '<a href="read/ch_1.html" class="btn-waline-auth" style="margin-top:8px;">Begin Reading Chapter 1</a>' : ''}
        </div>
      `;
      return;
    }

    listContainer.innerHTML = '';
    filtered.forEach(hl => {
      const card = document.createElement('div');
      card.className = `highlight-card color-${hl.color || 'gold'}`;
      card.id = `card-${hl.id}`;

      const colorNameMap = {
        gold: 'Golden Core',
        jade: 'Jade Wood',
        crimson: 'Slaughter Red',
        spirit: 'Spirit Blue',
        purple: 'Purple Mist'
      };
      const colorLabel = colorNameMap[hl.color] || 'Highlight';

      const jumpHref = hl.isChapterSummary ? `read/ch_${hl.chapter}.html#chapter-notes` : `read/ch_${hl.chapter}.html#${hl.id}`;

      card.innerHTML = `
        <div class="highlight-card-header">
          <a href="${jumpHref}" class="highlight-chapter-badge">
            <span>📖 Chapter ${hl.chapter}</span>
          </a>
          <div class="highlight-meta-right">
            <span class="color-badge color-${hl.color}">${colorLabel}</span>
            <span>${hl.isPublic !== false ? '🌐 Public' : '🔒 Private'}</span>
            ${hl.timestamp ? `<span>${new Date(hl.timestamp).toLocaleDateString()}</span>` : ''}
          </div>
        </div>

        <blockquote class="highlight-quote-box">
          “${escapeHtml(hl.text)}”
        </blockquote>

        ${hl.note ? `
          <div class="highlight-note-box">
            <span class="highlight-note-icon">📝</span>
            <div><strong>Insight:</strong> ${escapeHtml(hl.note)}</div>
          </div>
        ` : ''}

        <div class="highlight-card-actions">
          <a href="${jumpHref}" class="jump-link">
            <span>Jump to text in Chapter ${hl.chapter} →</span>
          </a>
          ${!isPublicMode ? `
            <div class="action-buttons-group">
              <button class="action-btn-mini btn-toggle-privacy" data-id="${hl.id}">
                ${hl.isPublic !== false ? 'Make Private' : 'Make Public'}
              </button>
              <button class="action-btn-mini danger btn-delete-hl" data-id="${hl.id}">
                Delete
              </button>
            </div>
          ` : ''}
        </div>
      `;

      if (!isPublicMode) {
        card.querySelector('.btn-toggle-privacy')?.addEventListener('click', () => {
          hl.isPublic = !hl.isPublic;
          persistHighlightChange(hl);
          renderHighlightsList();
        });

        card.querySelector('.btn-delete-hl')?.addEventListener('click', () => {
          if (confirm('Delete this highlight and note?')) {
            deleteHighlightItem(hl.id);
          }
        });
      }

      listContainer.appendChild(card);
    });
  }

  function persistHighlightChange(hl) {
    if (hl.isChapterSummary) return;
    const stored = getHighlights();
    stored[hl.id] = hl;
    saveHighlights(stored);
  }

  function deleteHighlightItem(id) {
    if (id.startsWith('ch_note_')) {
      const chNum = id.replace('ch_note_', '');
      localStorage.removeItem(`renegade_notes_ch_${chNum}`);
    } else {
      const stored = getHighlights();
      delete stored[id];
      saveHighlights(stored);
    }
    allHighlights = allHighlights.filter(h => h.id !== id);
    updateStatCounts();
    renderHighlightsList();
  }

  async function loadWalineComments(user, isPublicMode, publicUsername) {
    const commentsListEl = document.getElementById('comments-list-container');
    const commentCountEl = document.getElementById('stat-comments-count');
    const commentBadgeEl = document.getElementById('badge-comments-count');
    const serverURL = (window.WALINE_CONFIG && window.WALINE_CONFIG.serverURL) ? window.WALINE_CONFIG.serverURL.trim() : '';

    if (!serverURL) {
      if (commentCountEl) commentCountEl.textContent = '0';
      if (commentsListEl) {
        commentsListEl.innerHTML = '<div class="empty-state-card"><p>Waline serverURL not configured.</p></div>';
      }
      return;
    }

    try {
      // Fetch recent comments from Waline server
      const targetUser = isPublicMode ? publicUsername : (user ? (user.display_name || user.email) : null);
      const res = await fetch(`${serverURL}/api/comment?type=recent&count=100`);
      if (!res.ok) throw new Error('Waline API response error');

      const json = await res.json();
      const allComments = (json && Array.isArray(json.data)) ? json.data : [];

      // Filter comments by this cultivator if identity known
      let matched = allComments;
      if (targetUser) {
        matched = allComments.filter(c => {
          const author = (c.nick || c.author || '').toLowerCase();
          const email = (c.mail || '').toLowerCase();
          const q = targetUser.toLowerCase();
          return author.includes(q) || email.includes(q);
        });
      }

      userComments = matched;
      const count = matched.length;

      if (commentCountEl) commentCountEl.textContent = count;
      if (commentBadgeEl) commentBadgeEl.textContent = count;

      if (!commentsListEl) return;

      if (count === 0) {
        commentsListEl.innerHTML = `
          <div class="empty-state-card">
            <div class="empty-state-icon">💬</div>
            <h4 class="empty-state-title">No comments found</h4>
            <p class="empty-state-desc">
              ${targetUser ? `No recorded discussions under nickname "${targetUser}".` : 'Sign in to see your chapter comments and join fellow cultivators in chapter discussions!'}
            </p>
            <a href="read/ch_1.html#comments-section" class="btn-waline-auth" style="margin-top:8px;">Explore Chapter Discussions</a>
          </div>
        `;
        return;
      }

      commentsListEl.innerHTML = '';
      matched.forEach(c => {
        const card = document.createElement('div');
        card.className = 'comment-card';
        const dateStr = c.time ? new Date(c.time).toLocaleDateString() : '';
        const chapterPath = c.url || '/read/ch_1.html';
        const chapterMatch = chapterPath.match(/ch_(\d+)/);
        const chapterLabel = chapterMatch ? `Chapter ${chapterMatch[1]}` : 'General Discussion';

        card.innerHTML = `
          <div class="comment-header">
            <a href="${chapterPath}#comments-section" style="color:var(--accent-color); font-weight:600; text-decoration:none;">
              📖 ${chapterLabel}
            </a>
            <span>${dateStr}</span>
          </div>
          <div class="comment-content">
            ${c.comment || ''}
          </div>
        `;
        commentsListEl.appendChild(card);
      });

    } catch (err) {
      console.warn('Waline comments lookup skipped:', err);
      if (commentCountEl) commentCountEl.textContent = '0';
      if (commentsListEl) {
        commentsListEl.innerHTML = `
          <div class="empty-state-card">
            <div class="empty-state-icon">💬</div>
            <p class="empty-state-desc">Comments system is ready. Sign in on any chapter to start discussing.</p>
          </div>
        `;
      }
    }
  }

  function setupBackupTools() {
    const btnExport = document.getElementById('btn-export-data');
    const btnImport = document.getElementById('btn-import-data');
    const fileInput = document.getElementById('import-file-input');
    const btnClear = document.getElementById('btn-clear-all-data');

    if (btnExport) {
      btnExport.addEventListener('click', () => {
        const payload = {
          version: '1.0',
          exportedAt: new Date().toISOString(),
          highlights: getHighlights(),
          settings: localStorage.getItem(STORAGE_KEY_SETTINGS),
          lastRead: getLastRead()
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `renegade_reader_backup_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    if (btnImport && fileInput) {
      btnImport.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const data = JSON.parse(evt.target.result);
            if (data.highlights) {
              const current = getHighlights();
              const merged = { ...current, ...data.highlights };
              saveHighlights(merged);
            }
            alert('Cultivation insights successfully restored from backup.');
            window.location.reload();
          } catch (err) {
            alert('Invalid backup file.');
          }
        };
        reader.readAsText(file);
      });
    }

    if (btnClear) {
      btnClear.addEventListener('click', () => {
        if (confirm('Warning: Are you sure you want to erase all local highlights and notes? This action cannot be reversed.')) {
          localStorage.removeItem(STORAGE_KEY_HIGHLIGHTS);
          window.location.reload();
        }
      });
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

})();
