/* ==========================================================================
   Renegade Reader - Client Side Reader Engine (Desktop + Mobile)
   State persistence, 13-theme manager, typography, touch gestures & mobile bar
   ========================================================================== */

(function () {
  'use strict';

  const STORAGE_KEY_SETTINGS = 'renegade_reader_settings';
  const STORAGE_KEY_LAST_READ = 'renegade_last_read';

  const DEFAULT_SETTINGS = {
    theme: 'slaughter',
    fontSize: 19,
    lineHeight: 1.8,
    maxWidth: 780,
    fontFamily: "'Merriweather', Georgia, serif"
  };

  function getSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings to localStorage:', e);
    }
  }

  function applySettings(settings) {
    const root = document.documentElement;
    root.setAttribute('data-theme', settings.theme);
    root.style.setProperty('--font-size', settings.fontSize + 'px');
    root.style.setProperty('--line-height', settings.lineHeight);
    root.style.setProperty('--reader-max-width', settings.maxWidth + 'px');
    root.style.setProperty('--font-family', settings.fontFamily);

    // Update UI controls
    const fontVal = document.getElementById('val-font-size');
    if (fontVal) fontVal.textContent = settings.fontSize + 'px';
    const fontSlider = document.getElementById('slider-font-size');
    if (fontSlider) fontSlider.value = settings.fontSize;

    const lineVal = document.getElementById('val-line-height');
    if (lineVal) lineVal.textContent = settings.lineHeight;
    const lineSlider = document.getElementById('slider-line-height');
    if (lineSlider) lineSlider.value = settings.lineHeight;

    const widthVal = document.getElementById('val-max-width');
    if (widthVal) widthVal.textContent = settings.maxWidth + 'px';
    const widthSlider = document.getElementById('slider-max-width');
    if (widthSlider) widthSlider.value = settings.maxWidth;

    const fontSelect = document.getElementById('select-font-family');
    if (fontSelect) fontSelect.value = settings.fontFamily;

    // Theme active states
    document.querySelectorAll('.theme-btn').forEach(btn => {
      if (btn.getAttribute('data-theme-name') === settings.theme) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (window.updateGiscusTheme) {
      window.updateGiscusTheme(settings.theme);
    }
  }

  // Reading progress tracking
  function updateProgress() {
    const h = document.documentElement;
    const b = document.body;
    const st = 'scrollTop';
    const sh = 'scrollHeight';
    const percent = ((h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight)) * 100;
    const bar = document.getElementById('progress-bar');
    if (bar) {
      bar.style.width = Math.min(100, Math.max(0, percent)) + '%';
    }
  }

  // Cultivator's Insights (Local Chapter Notes)
  function initNotes(chapterNum) {
    const noteArea = document.getElementById('chapter-notes');
    const statusLabel = document.getElementById('notes-status');
    const saveBtn = document.getElementById('btn-save-note');
    const clearBtn = document.getElementById('btn-clear-note');
    if (!noteArea || !chapterNum) return;

    const noteKey = `renegade_notes_ch_${chapterNum}`;
    const savedNote = localStorage.getItem(noteKey) || '';
    noteArea.value = savedNote;

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const val = noteArea.value.trim();
        if (val) {
          localStorage.setItem(noteKey, val);
          if (statusLabel) {
            statusLabel.textContent = 'Enlightenment insight saved to spiritual sea.';
            setTimeout(() => (statusLabel.textContent = ''), 3000);
          }
        } else {
          localStorage.removeItem(noteKey);
          if (statusLabel) {
            statusLabel.textContent = 'Note cleared.';
            setTimeout(() => (statusLabel.textContent = ''), 3000);
          }
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        noteArea.value = '';
        localStorage.removeItem(noteKey);
        if (statusLabel) {
          statusLabel.textContent = 'Note cleared.';
          setTimeout(() => (statusLabel.textContent = ''), 3000);
        }
      });
    }
  }

  // Chapter Discussions (Giscus Comments with Lazy Load)
  function initGiscusComments() {
    const threadContainer = document.getElementById('giscus-thread-container');
    if (!threadContainer) return;

    const term = threadContainer.getAttribute('data-term') || document.title;

    function triggerGiscus() {
      if (window.loadGiscus) {
        window.loadGiscus(threadContainer, term);
      }
    }

    // Redirect button to chapter discussions: smooth scroll and immediate load
    const discussButtons = document.querySelectorAll('a[href="#comments-section"]');
    discussButtons.forEach(btn => {
      btn.addEventListener('click', e => {
        const target = document.getElementById('comments-section');
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          triggerGiscus();
        }
      });
    });

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            obs.disconnect();
            triggerGiscus();
          }
        });
      }, { rootMargin: '300px 0px' });
      observer.observe(threadContainer);
    } else {
      triggerGiscus();
    }
  }

  // Keyboard navigation
  function initKeyboardNav() {
    document.addEventListener('keydown', e => {
      if (['TEXTAREA', 'INPUT', 'SELECT'].includes(document.activeElement.tagName)) {
        if (e.key === 'Escape') {
          document.activeElement.blur();
          closeAllDrawers();
        }
        return;
      }
      if (e.key === 'ArrowLeft') {
        const prev = document.getElementById('nav-prev-btn');
        if (prev && prev.getAttribute('href')) window.location.href = prev.getAttribute('href');
      } else if (e.key === 'ArrowRight') {
        const next = document.getElementById('nav-next-btn');
        if (next && next.getAttribute('href')) window.location.href = next.getAttribute('href');
      } else if (e.key === 'c' || e.key === 'C' || e.key === 't' || e.key === 'T') {
        e.preventDefault();
        toggleChaptersDrawer();
      } else if (e.key === 'Escape') {
        closeAllDrawers();
      }
    });
  }

  // Swipe & Touch gesture navigation
  function initTouchNavigation() {
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    const swipeHint = document.getElementById('swipe-hint');

    function showSwipeHint(text) {
      if (!swipeHint) return;
      swipeHint.textContent = text;
      swipeHint.classList.add('show');
      setTimeout(() => swipeHint.classList.remove('show'), 1200);
    }

    document.addEventListener('touchstart', e => {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startTime = Date.now();
    }, { passive: true });

    document.addEventListener('touchend', e => {
      if (!startX || !startY) return;
      const target = e.target;
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = endX - startX;
      const diffY = endY - startY;
      const elapsed = Date.now() - startTime;

      const chaptersDrawer = document.getElementById('chapters-drawer');
      const isChaptersOpen = chaptersDrawer && chaptersDrawer.classList.contains('open');

      // Edge swipe right to open chapters drawer (started near left edge: < 40px)
      if (!isChaptersOpen && startX < 40 && diffX > 60 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
        openChaptersDrawer();
        startX = 0;
        startY = 0;
        return;
      }

      // Swipe left on chapters drawer to close it
      if (isChaptersOpen && diffX < -60) {
        closeChaptersDrawer();
        startX = 0;
        startY = 0;
        return;
      }

      // Don't trigger page swipe navigation if interacting with controls, inputs, or drawers
      if (target.closest('.chapters-drawer, .settings-drawer, .reader-header, .mobile-bottom-bar, .cultivator-notes-section, select, button, input, textarea, a')) {
        return;
      }

      // Swipe threshold: fast (< 450ms), horizontal distance > 75px, angle > 2.2x vertical
      if (elapsed < 450 && Math.abs(diffX) > 75 && Math.abs(diffX) > Math.abs(diffY) * 2.2) {
        if (diffX < 0) {
          // Swipe Left -> Next chapter
          const nextBtn = document.getElementById('nav-next-btn');
          if (nextBtn && nextBtn.getAttribute('href') && !nextBtn.classList.contains('disabled')) {
            showSwipeHint('Next Chapter →');
            setTimeout(() => { window.location.href = nextBtn.getAttribute('href'); }, 150);
          }
        } else {
          // Swipe Right -> Prev chapter
          const prevBtn = document.getElementById('nav-prev-btn');
          if (prevBtn && prevBtn.getAttribute('href') && !prevBtn.classList.contains('disabled')) {
            showSwipeHint('← Previous Chapter');
            setTimeout(() => { window.location.href = prevBtn.getAttribute('href'); }, 150);
          }
        }
      }
      startX = 0;
      startY = 0;
    }, { passive: true });
  }

  // Immersive Auto-Hide on scroll & tap
  function initImmersiveReading() {
    const header = document.getElementById('reader-header');
    const mobileBar = document.getElementById('mobile-bar');
    let lastScrollY = window.scrollY;
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const delta = currentScrollY - lastScrollY;

          // Auto hide when scrolling down, show when scrolling up
          if (delta > 15 && currentScrollY > 120) {
            if (header) header.classList.add('immersive-hidden');
            if (mobileBar) mobileBar.classList.add('immersive-hidden');
          } else if (delta < -10 || currentScrollY < 80) {
            if (header) header.classList.remove('immersive-hidden');
            if (mobileBar) mobileBar.classList.remove('immersive-hidden');
          }

          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    // Center screen tap toggles header and toolbar
    const readerContent = document.getElementById('reader-content');
    if (readerContent) {
      readerContent.addEventListener('click', e => {
        if (e.target.closest('a, button, input, textarea, select, .cultivator-notes-section')) return;
        if (header) header.classList.toggle('immersive-hidden');
        if (mobileBar) mobileBar.classList.toggle('immersive-hidden');
      });
    }

    // Scroll to top button
    const topBtn = document.getElementById('m-btn-top');
    if (topBtn) {
      topBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    let currentSettings = getSettings();
    applySettings(currentSettings);

    const chapterMeta = document.querySelector('meta[name="chapter-number"]');
    const currentChapter = chapterMeta ? parseInt(chapterMeta.getAttribute('content'), 10) : null;

    if (currentChapter) {
      localStorage.setItem(STORAGE_KEY_LAST_READ, JSON.stringify({
        chapter: currentChapter,
        title: document.title,
        timestamp: Date.now()
      }));
      initNotes(currentChapter);
    }

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();

    // Drawer Selectors
    const settingsBtn = document.getElementById('btn-open-settings');
    const mobileSettingsBtn = document.getElementById('m-btn-settings');
    const closeSettingsBtn = document.getElementById('btn-close-settings');
    const settingsDrawer = document.getElementById('settings-drawer');

    const chaptersBtn = document.getElementById('btn-open-chapters');
    const mobileChaptersBtn = document.getElementById('m-btn-chapters');
    const closeChaptersBtn = document.getElementById('btn-close-chapters');
    const chaptersDrawer = document.getElementById('chapters-drawer');

    const backdrop = document.getElementById('drawer-backdrop');
    const dragHandle = document.getElementById('drawer-drag-handle');

    function openSettingsDrawer() {
      if (chaptersDrawer) chaptersDrawer.classList.remove('open');
      if (settingsDrawer) settingsDrawer.classList.add('open');
      if (backdrop) backdrop.classList.add('active');
    }

    function closeSettingsDrawer() {
      if (settingsDrawer) settingsDrawer.classList.remove('open');
      if ((!chaptersDrawer || !chaptersDrawer.classList.contains('open')) && backdrop) {
        backdrop.classList.remove('active');
      }
    }

    function openChaptersDrawer() {
      if (settingsDrawer) settingsDrawer.classList.remove('open');
      if (chaptersDrawer) chaptersDrawer.classList.add('open');
      if (backdrop) backdrop.classList.add('active');
      loadChaptersIntoDrawer();
    }

    function closeChaptersDrawer() {
      if (chaptersDrawer) chaptersDrawer.classList.remove('open');
      if ((!settingsDrawer || !settingsDrawer.classList.contains('open')) && backdrop) {
        backdrop.classList.remove('active');
      }
    }

    function toggleChaptersDrawer() {
      if (chaptersDrawer && chaptersDrawer.classList.contains('open')) {
        closeChaptersDrawer();
      } else {
        openChaptersDrawer();
      }
    }

    function closeAllDrawers() {
      if (chaptersDrawer) chaptersDrawer.classList.remove('open');
      if (settingsDrawer) settingsDrawer.classList.remove('open');
      if (backdrop) backdrop.classList.remove('active');
    }

    window.openChaptersDrawer = openChaptersDrawer;
    window.closeChaptersDrawer = closeChaptersDrawer;
    window.toggleChaptersDrawer = toggleChaptersDrawer;
    window.closeAllDrawers = closeAllDrawers;

    if (settingsBtn) settingsBtn.addEventListener('click', openSettingsDrawer);
    if (mobileSettingsBtn) mobileSettingsBtn.addEventListener('click', openSettingsDrawer);
    if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', closeSettingsDrawer);

    if (chaptersBtn) chaptersBtn.addEventListener('click', openChaptersDrawer);
    if (mobileChaptersBtn) mobileChaptersBtn.addEventListener('click', openChaptersDrawer);
    if (closeChaptersBtn) closeChaptersBtn.addEventListener('click', closeChaptersDrawer);

    if (backdrop) backdrop.addEventListener('click', closeAllDrawers);
    if (dragHandle) dragHandle.addEventListener('click', closeSettingsDrawer);

    // Chapter catalog lazy-loading and dynamic search inside drawer
    let cachedBooks = null;
    let cachedChapters = null;
    let isChapterDrawerLoaded = false;
    let isChapterDrawerLoading = false;

    async function loadChaptersIntoDrawer() {
      if (isChapterDrawerLoaded) {
        focusActiveChapter();
        return;
      }
      if (isChapterDrawerLoading) return;
      isChapterDrawerLoading = true;

      const volumesContainer = document.getElementById('drawer-volumes-container');
      const searchInput = document.getElementById('drawer-chapter-search');
      const clearSearchBtn = document.getElementById('btn-clear-chapter-search');
      const currentChapterNum = currentChapter || 1;

      try {
        if (!cachedBooks || !cachedChapters) {
          const [booksRes, chaptersRes] = await Promise.all([
            fetch('../meta/books.json').then(r => r.json()),
            fetch('../meta/chapters.json').then(r => r.json())
          ]);
          cachedBooks = booksRes;
          cachedChapters = chaptersRes;
        }

        const chaptersByBook = {};
        cachedBooks.forEach(b => { chaptersByBook[b.book] = []; });
        cachedChapters.forEach(ch => {
          if (chaptersByBook[ch.book]) {
            chaptersByBook[ch.book].push(ch);
          }
        });

        // Find current book
        let currentBookNum = 1;
        const foundCh = cachedChapters.find(c => c.chapter === currentChapterNum);
        if (foundCh) currentBookNum = foundCh.book;

        let html = '';
        cachedBooks.forEach(b => {
          const bChapters = chaptersByBook[b.book] || [];
          const isCurrentBook = b.book === currentBookNum;
          const openAttr = isCurrentBook ? 'open' : '';

          let chListHtml = '';
          bChapters.forEach(ch => {
            const isActive = ch.chapter === currentChapterNum;
            const activeClass = isActive ? ' active' : '';
            const activeAttr = isActive ? ' id="drawer-active-chapter"' : '';
            let displayTitle = ch.title;
            if (!displayTitle.toLowerCase().startsWith('chapter ' + ch.chapter)) {
              displayTitle = 'Ch. ' + ch.chapter + ' – ' + displayTitle;
            }

            chListHtml += `<a href="ch_${ch.chapter}.html" class="drawer-ch-item${activeClass}"${activeAttr} data-num="${ch.chapter}" data-title="${ch.title.toLowerCase()}"><span class="drawer-ch-title">${displayTitle}</span><span class="drawer-ch-num">#${ch.chapter}</span></a>`;
          });

          html += `
            <details class="drawer-book-group" data-book-num="${b.book}" ${openAttr}>
              <summary class="drawer-book-summary">
                <span>Book ${b.book}: ${b.title}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </summary>
              <div class="drawer-chapter-list">
                ${chListHtml}
              </div>
            </details>
          `;
        });

        if (volumesContainer) {
          volumesContainer.innerHTML = html;
        }
        isChapterDrawerLoaded = true;
        isChapterDrawerLoading = false;

        // Setup live search
        if (searchInput) {
          searchInput.addEventListener('input', e => {
            const q = e.target.value.toLowerCase().trim();
            if (clearSearchBtn) {
              clearSearchBtn.style.display = q ? 'block' : 'none';
            }

            const bookGroups = volumesContainer.querySelectorAll('.drawer-book-group');
            let totalVisible = 0;

            bookGroups.forEach(group => {
              const items = group.querySelectorAll('.drawer-ch-item');
              let groupHasMatch = false;

              items.forEach(item => {
                if (!q) {
                  item.style.display = 'flex';
                  groupHasMatch = true;
                  totalVisible++;
                } else {
                  const title = item.getAttribute('data-title') || '';
                  const num = item.getAttribute('data-num') || '';
                  if (title.includes(q) || num === q || ('chapter ' + num).includes(q)) {
                    item.style.display = 'flex';
                    groupHasMatch = true;
                    totalVisible++;
                  } else {
                    item.style.display = 'none';
                  }
                }
              });

              if (q) {
                if (groupHasMatch) {
                  group.style.display = 'block';
                  group.open = true;
                } else {
                  group.style.display = 'none';
                }
              } else {
                group.style.display = 'block';
                const bNum = parseInt(group.getAttribute('data-book-num') || '0', 10);
                group.open = (bNum === currentBookNum);
              }
            });

            let emptyMsg = document.getElementById('drawer-no-results');
            if (totalVisible === 0) {
              if (!emptyMsg) {
                emptyMsg = document.createElement('div');
                emptyMsg.id = 'drawer-no-results';
                emptyMsg.className = 'drawer-empty-search';
                emptyMsg.textContent = 'No chapters found matching "' + q + '".';
                volumesContainer.appendChild(emptyMsg);
              } else {
                emptyMsg.textContent = 'No chapters found matching "' + q + '".';
                emptyMsg.style.display = 'block';
              }
            } else if (emptyMsg) {
              emptyMsg.style.display = 'none';
            }
          });

          if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
              searchInput.value = '';
              searchInput.dispatchEvent(new Event('input'));
              searchInput.focus();
            });
          }
        }

        setTimeout(focusActiveChapter, 80);

      } catch (err) {
        console.error('Failed to load chapters in drawer:', err);
        isChapterDrawerLoading = false;
        if (volumesContainer) {
          volumesContainer.innerHTML = '<div class="drawer-empty-search"><p>Unable to load chapters.</p><a href="../chapters" class="icon-btn" style="display:inline-block; margin-top:8px;">Open Full Catalog</a></div>';
        }
      }
    }

    function focusActiveChapter() {
      const activeEl = document.getElementById('drawer-active-chapter');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }

    // Theme clicks
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentSettings.theme = btn.getAttribute('data-theme-name');
        saveSettings(currentSettings);
        applySettings(currentSettings);
      });
    });

    // Font size
    const fontSlider = document.getElementById('slider-font-size');
    if (fontSlider) {
      fontSlider.addEventListener('input', e => {
        currentSettings.fontSize = parseInt(e.target.value, 10);
        saveSettings(currentSettings);
        applySettings(currentSettings);
      });
    }

    // Line height
    const lineSlider = document.getElementById('slider-line-height');
    if (lineSlider) {
      lineSlider.addEventListener('input', e => {
        currentSettings.lineHeight = parseFloat(e.target.value);
        saveSettings(currentSettings);
        applySettings(currentSettings);
      });
    }

    // Max width
    const widthSlider = document.getElementById('slider-max-width');
    if (widthSlider) {
      widthSlider.addEventListener('input', e => {
        currentSettings.maxWidth = parseInt(e.target.value, 10);
        saveSettings(currentSettings);
        applySettings(currentSettings);
      });
    }

    // Font family
    const fontSelect = document.getElementById('select-font-family');
    if (fontSelect) {
      fontSelect.addEventListener('change', e => {
        currentSettings.fontFamily = e.target.value;
        saveSettings(currentSettings);
        applySettings(currentSettings);
      });
    }

    initKeyboardNav();
    initTouchNavigation();
    initImmersiveReading();
    initGiscusComments();

    // Register PWA Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        const swUrl = window.location.pathname.includes('/read/') ? '../sw.js' : './sw.js';
        navigator.serviceWorker.register(swUrl).catch(e => {
          console.debug('ServiceWorker registration skipped:', e);
        });
      });
    }
  });
})();
