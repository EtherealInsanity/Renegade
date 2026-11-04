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

  // Canonical 4-Tier Cultivation Dao Progression (Pure English)
  const DAO_STEPS = [
    {
      id: 'step-1',
      title: '1st Step',
      name: '1st Step: Mortal to Immortal',
      subtitle: 'Spiritual Sea, Core & Life/Death Domains',
      minChapter: 1,
      maxChapter: 880,
      realms: [
        { name: 'Qi Condensation', startChapter: 1, endChapter: 50, desc: 'Entering Heng Yue Sect, absorbing spiritual qi with the Heaven Defying Bead.' },
        { name: 'Foundation Establishment', startChapter: 51, endChapter: 143, desc: 'Breaking mortal limitations, forming the spiritual sea and foundation.' },
        { name: 'Core Formation', startChapter: 144, endChapter: 223, desc: 'Forming the Dan core, cultivating the death essence in the Sea of Devils.' },
        { name: 'Nascent Soul', startChapter: 224, endChapter: 324, desc: 'Birth of the Nascent Soul, slaughtering the sea of devils and comprehending mortality.' },
        { name: 'Soul Formation', startChapter: 325, endChapter: 419, desc: 'Comprehending the Domain of Life and Death in the mortal country of Zhao.' },
        { name: 'Soul Transformation', startChapter: 420, endChapter: 649, desc: 'Absorbing celestial spiritual energy in the Celestial Realm to temper the origin soul.' },
        { name: 'Ascendant', startChapter: 650, endChapter: 800, desc: 'Domain crystallization into Dao intent, standing at the summit of Planet Suzaku.' },
        { name: 'Half-Step Yin-Yang (Corporeal Boundary)', startChapter: 801, endChapter: 880, desc: 'Comprehending the illusion of cause and effect, life and death, touching the 2nd Step.' }
      ]
    },
    {
      id: 'step-2',
      title: '2nd Step',
      name: '2nd Step: Domain & Nirvana',
      subtitle: 'Nirvana Comprehension & The 5 Heavenly Deva Blights',
      minChapter: 881,
      maxChapter: 1660,
      realms: [
        { name: 'Nirvana Scryer', startChapter: 881, endChapter: 1050, desc: 'Scrying into the realm of Nirvana, grasping the origin rules of heaven.' },
        { name: 'Nirvana Cleanser', startChapter: 1051, endChapter: 1200, desc: 'Cleansing the origin soul, battling through the Cloud Sea Star System.' },
        { name: 'Nirvana Shatterer', startChapter: 1201, endChapter: 1380, desc: 'Shattering Nirvana, fusing with the 8-Star Royal Ancient God body.' },
        { name: '1st Deva Blight: Flesh & Blood', startChapter: 1381, endChapter: 1439, desc: 'Heavenly Tribulation: Physical vessel rots under heavenly condemnation.', isBlight: true },
        { name: '2nd Deva Blight: Origin & Bones', startChapter: 1440, endChapter: 1499, desc: 'Heavenly Tribulation: Origin power deteriorates and spiritual energy revolts.', isBlight: true },
        { name: '3rd Deva Blight: Origin Soul', startChapter: 1500, endChapter: 1569, desc: 'Heavenly Tribulation: The origin soul burns in spiritual tribulation fire.', isBlight: true },
        { name: '4th Deva Blight: Dao Heart', startChapter: 1570, endChapter: 1629, desc: 'Heavenly Tribulation: Soul is plagued by inner demons and karmic illusions.', isBlight: true },
        { name: '5th Deva Blight: Life Decline', startChapter: 1630, endChapter: 1660, desc: 'Supreme Blight: Lifespan drains into the void, transcending mortality to enter the 3rd Step.', isBlight: true }
      ]
    },
    {
      id: 'step-3',
      title: '3rd Step',
      name: '3rd Step: Void & Essences',
      subtitle: 'Void Mastery, 9 Essences & Great Empyrean Trials',
      minChapter: 1661,
      maxChapter: 2060,
      realms: [
        { name: 'Nirvana Void', startChapter: 1661, endChapter: 1770, desc: 'Entering the Void Step, comprehending the fundamental Dao of heaven.' },
        { name: 'Spirit Void', startChapter: 1771, endChapter: 1870, desc: 'Awakening 9-Star Ancient God royal line and mastering 7 Dao Essences.' },
        { name: 'Arcane Void', startChapter: 1871, endChapter: 1950, desc: 'Conquering the God, Demon, and Devil paths, condensing 9 Origin Essences.' },
        { name: 'Void Tribulant: Trials 1-3 (Earth & Heaven Calamity)', startChapter: 1951, endChapter: 1980, desc: 'Heaven Tribulation Trials: Shattering the early tribulations of the Heavenly Dao.', isTrial: true },
        { name: 'Void Tribulant: Trials 4-6 (Great Empyrean Trial)', startChapter: 1981, endChapter: 2010, desc: 'Heaven Tribulation Trials: Competing with Great Empyreans, slaughtering divine wills.', isTrial: true },
        { name: 'Void Tribulant: Trials 7-9 (Heavenly Dao Will Severing)', startChapter: 2011, endChapter: 2040, desc: 'Heaven Tribulation Trials: Severing the will of the Heavenly Dao and shattering destiny.', isTrial: true },
        { name: 'Half-Step Heaven Trampling (Ascendant Empyrean)', startChapter: 2041, endChapter: 2060, desc: 'The summit of Immortal Gang, standing before the 9 Heaven Trampling Bridges.' }
      ]
    },
    {
      id: 'step-4',
      title: 'Heaven Trampling',
      name: '4th Step: Heaven Trampling',
      subtitle: 'Sovereign Beyond Destiny (The 9 Heaven Trampling Bridges)',
      minChapter: 2061,
      maxChapter: 2088,
      realms: [
        { name: '1st - 3rd Heaven Trampling Bridge', startChapter: 2061, endChapter: 2070, desc: 'Breaking mortal and immortal laws, stepping onto the supreme cosmic void.', isBridge: true },
        { name: '4th - 6th Heaven Trampling Bridge', startChapter: 2071, endChapter: 2080, desc: 'Severing karmic chains of reincarnation, time, and false illusions.', isBridge: true },
        { name: '7th - 9th Heaven Trampling Bridge', startChapter: 2081, endChapter: 2087, desc: 'Transcending all creation, defying the heavens and ascending the 9th Bridge.', isBridge: true },
        { name: 'Heaven Trampling Sovereign (True Dao Sovereign)', startChapter: 2088, endChapter: 9999, desc: 'Walking beyond the 9th bridge. "I am Wang Lin, Sovereign of Heaven Trampling!"', isSovereign: true }
      ]
    }
  ];

  function getDaoProgression(chapter) {
    const ch = Math.max(1, chapter || 1);
    let activeStep = DAO_STEPS[0];
    let activeRealm = activeStep.realms[0];

    for (const step of DAO_STEPS) {
      if (ch >= step.minChapter) {
        activeStep = step;
        for (const realm of step.realms) {
          if (ch >= realm.startChapter) {
            activeRealm = realm;
          }
        }
      }
    }

    const realmSpan = activeRealm.endChapter - activeRealm.startChapter + 1;
    const progressInRealm = Math.min(100, Math.max(0, Math.round(((ch - activeRealm.startChapter) / realmSpan) * 100)));

    return {
      currentChapter: ch,
      step: activeStep,
      realm: activeRealm,
      progressInRealm: progressInRealm
    };
  }

  window.RenegadeDao = {
    steps: DAO_STEPS,
    getProgression: getDaoProgression
  };

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
    setupAvatarUploader();
    renderDaoRoadmap(lastRead ? lastRead.chapter : 1);

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
    const dao = getDaoProgression(currentChapter);

    if (realmBadgeEl) {
      realmBadgeEl.innerHTML = `<span style="opacity:0.85;">${dao.step.title}</span> · <strong>${dao.realm.name.split(' (')[0]}</strong>`;
    }

    if (isPublicMode) {
      if (nameEl) nameEl.textContent = publicUsername;
      if (avatarEl) {
        avatarEl.textContent = (publicUsername[0] || 'C').toUpperCase();
        avatarEl.title = `Cultivator ${publicUsername}`;
      }
      if (statusEl) statusEl.textContent = 'Fellow Cultivator Public Profile';
      if (authActionBtn) authActionBtn.style.display = 'none';
      return;
    }

    // Avatar resolution: custom uploaded avatar > Waline avatar > initial > default
    const customAvatar = localStorage.getItem('renegade_user_avatar');
    const avatarUrl = customAvatar || (user ? user.avatar : '');

    if (avatarEl) {
      if (avatarUrl) {
        avatarEl.innerHTML = `<img src="${avatarUrl}" alt="Cultivator Avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
      } else if (user) {
        const displayName = user.display_name || user.email || 'Cultivator';
        avatarEl.textContent = displayName[0].toUpperCase();
      } else {
        avatarEl.textContent = '☯️';
      }
    }

    if (user && user.token) {
      const displayName = user.display_name || user.email || 'Cultivator';
      if (nameEl) nameEl.textContent = displayName;
      if (statusEl) {
        const role = user.type === 'administrator' ? 'Grand Elder (Admin)' : 'Inner Disciple (Verified Reader)';
        statusEl.textContent = `${role} · ${user.email || ''}`;
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
      if (nameEl) nameEl.textContent = 'Wandering Cultivator (Guest)';
      if (statusEl) statusEl.textContent = 'Local Guest · Sign in with Waline to sync across devices & publish profile';
      if (authActionBtn) {
        authActionBtn.textContent = 'Sign In / Register';
        authActionBtn.onclick = (e) => {
          e.preventDefault();
          toggleWalineLoginEmbed();
        };
      }
    }
  }

  function setupAvatarUploader() {
    const avatarWrap = document.getElementById('profile-avatar-wrap');
    const avatarInput = document.getElementById('avatar-file-input');
    if (!avatarWrap || !avatarInput) return;

    avatarWrap.addEventListener('click', () => {
      const choice = confirm('Cultivator Portrait: Click OK to upload an avatar image from your device, or Cancel to enter an image URL.');
      if (choice) {
        avatarInput.click();
      } else {
        const url = prompt('Enter image URL for your cultivator avatar:');
        if (url && url.trim()) {
          saveUserAvatar(url.trim());
        }
      }
    });

    avatarInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size exceeds 2MB limit. Please choose a smaller portrait.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        saveUserAvatar(evt.target.result);
      };
      reader.readAsDataURL(file);
    });
  }

  function saveUserAvatar(avatarUrl) {
    try {
      localStorage.setItem('renegade_user_avatar', avatarUrl);
      const walineUser = JSON.parse(localStorage.getItem('WALINE_USER') || '{}');
      if (walineUser && typeof walineUser === 'object') {
        walineUser.avatar = avatarUrl;
        localStorage.setItem('WALINE_USER', JSON.stringify(walineUser));
      }
    } catch (_) {}

    const avatarEl = document.getElementById('profile-avatar');
    if (avatarEl) {
      avatarEl.innerHTML = `<img src="${avatarUrl}" alt="Cultivator Avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
    }
  }

  function renderDaoRoadmap(currentChapter) {
    const roadmapContainer = document.getElementById('dao-roadmap-container');
    if (!roadmapContainer) return;

    const dao = getDaoProgression(currentChapter);
    const ch = dao.currentChapter;

    let html = `
      <div class="active-realm-hero-card">
        <div class="active-realm-meta">
          <span class="active-step-pill">${dao.step.name}</span>
          <h2 class="active-realm-title">${dao.realm.name}</h2>
          <p class="active-realm-desc">${dao.realm.desc}</p>
        </div>
        <div class="active-realm-progress-box">
          <div class="active-progress-header">
            <span>Realm Cultivation Progress</span>
            <span class="active-progress-pct">${dao.progressInRealm}%</span>
          </div>
          <div class="realm-progress-bar-wrap">
            <div class="realm-progress-fill" style="width: ${dao.progressInRealm}%;"></div>
          </div>
          <div class="active-progress-subtext">Chapter ${ch} Cultivated · Steadily advancing toward breakthrough</div>
        </div>
      </div>

      <div class="dao-steps-ladder">
    `;

    DAO_STEPS.forEach((step) => {
      const isStepPassed = ch > step.maxChapter;
      const isStepActive = ch >= step.minChapter && ch <= step.maxChapter;

      let statusBadge = '';
      let statusClass = '';
      if (isStepPassed) {
        statusBadge = '<span>✅ Conquered</span>';
        statusClass = 'step-conquered';
      } else if (isStepActive) {
        statusBadge = '<span class="status-pulse-badge">⚡ Cultivating</span>';
        statusClass = 'step-active';
      } else {
        statusBadge = '<span>🔒 Locked</span>';
        statusClass = 'step-locked';
      }

      html += `
        <div class="dao-step-card ${statusClass}">
          <div class="dao-step-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="dao-step-title-group">
              <div class="dao-step-num">${step.title}</div>
              <div class="dao-step-names">
                <h3>${step.name}</h3>
                <span class="dao-step-subtitle">${step.subtitle}</span>
              </div>
            </div>
            <div class="dao-step-meta-right">
              <div class="step-status-tag ${statusClass}">${statusBadge}</div>
              <button class="step-toggle-btn" aria-label="Toggle Step Details">▼</button>
            </div>
          </div>

          <div class="dao-subrealms-list">
      `;

      step.realms.forEach((realm) => {
        const isRealmPassed = ch > realm.endChapter;
        const isRealmActive = ch >= realm.startChapter && ch <= realm.endChapter;

        let realmStatusIcon = '🔒';
        let realmItemClass = 'realm-locked';
        let specialBadge = '';

        if (realm.isBlight) {
          specialBadge = '<span class="realm-special-tag blight">💀 Deva Blight</span>';
        } else if (realm.isTrial) {
          specialBadge = '<span class="realm-special-tag trial">⚡ Void Trial</span>';
        } else if (realm.isBridge) {
          specialBadge = '<span class="realm-special-tag bridge">🌉 Heaven Bridge</span>';
        } else if (realm.isSovereign) {
          specialBadge = '<span class="realm-special-tag sovereign">👑 Sovereign</span>';
        }

        if (isRealmPassed) {
          realmStatusIcon = '✓';
          realmItemClass = 'realm-passed';
        } else if (isRealmActive) {
          realmStatusIcon = '⚡';
          realmItemClass = 'realm-active';
        }

        html += `
          <div class="dao-subrealm-item ${realmItemClass}">
            <div class="subrealm-icon-wrap">${realmStatusIcon}</div>
            <div class="subrealm-content">
              <div class="subrealm-top-row">
                <span class="subrealm-name">${realm.name}</span>
                ${specialBadge}
                ${isRealmActive ? `<span class="active-beacon-pill">Current Realm (${dao.progressInRealm}%)</span>` : ''}
              </div>
              <p class="subrealm-desc">${realm.desc}</p>
              ${isRealmActive ? `
                <div class="realm-mini-progress-bar">
                  <div class="realm-mini-progress-fill" style="width: ${dao.progressInRealm}%;"></div>
                </div>
              ` : ''}
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    html += `</div>`;
    roadmapContainer.innerHTML = html;
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
    const ch = lastRead ? lastRead.chapter : 1;
    const pct = Math.min(100, Math.round((ch / TOTAL_CHAPTERS) * 100));
    if (readProgressEl) readProgressEl.textContent = `${pct}%`;

    renderDaoRoadmap(ch);
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
