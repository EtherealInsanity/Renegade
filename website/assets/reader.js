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

  // Daoist Assembly (Chapter Giscus Comments with Lazy Load)
  function initGiscusComments() {
    const threadContainer = document.getElementById('giscus-thread-container');
    if (!threadContainer) return;

    const term = threadContainer.getAttribute('data-term') || document.title;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            obs.disconnect();
            if (window.loadGiscus) {
              window.loadGiscus(threadContainer, term);
            }
          }
        });
      }, { rootMargin: '300px 0px' });
      observer.observe(threadContainer);
    } else {
      if (window.loadGiscus) {
        window.loadGiscus(threadContainer, term);
      }
    }
  }

  // Keyboard navigation
  function initKeyboardNav() {
    document.addEventListener('keydown', e => {
      if (['TEXTAREA', 'INPUT', 'SELECT'].includes(document.activeElement.tagName)) return;
      if (e.key === 'ArrowLeft') {
        const prev = document.getElementById('nav-prev-btn');
        if (prev && prev.getAttribute('href')) window.location.href = prev.getAttribute('href');
      } else if (e.key === 'ArrowRight') {
        const next = document.getElementById('nav-next-btn');
        if (next && next.getAttribute('href')) window.location.href = next.getAttribute('href');
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
      // Don't trigger if interacting with controls, inputs, or drawer
      const target = e.target;
      if (target.closest('.settings-drawer, .reader-header, .mobile-bottom-bar, .cultivator-notes-section, select, button, input, textarea, a')) {
        return;
      }

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = endX - startX;
      const diffY = endY - startY;
      const elapsed = Date.now() - startTime;

      // Swipe threshold: fast (< 450ms), horizontal distance > 75px, angle > 2.5x vertical
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

    // Drawer Open/Close
    const settingsBtn = document.getElementById('btn-open-settings');
    const mobileSettingsBtn = document.getElementById('m-btn-settings');
    const closeBtn = document.getElementById('btn-close-settings');
    const drawer = document.getElementById('settings-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    const dragHandle = document.getElementById('drawer-drag-handle');

    function openDrawer() {
      if (drawer) drawer.classList.add('open');
      if (backdrop) backdrop.classList.add('active');
    }

    function closeDrawer() {
      if (drawer) drawer.classList.remove('open');
      if (backdrop) backdrop.classList.remove('active');
    }

    if (settingsBtn) settingsBtn.addEventListener('click', openDrawer);
    if (mobileSettingsBtn) mobileSettingsBtn.addEventListener('click', openDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (backdrop) backdrop.addEventListener('click', closeDrawer);
    if (dragHandle) dragHandle.addEventListener('click', closeDrawer);

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

    // Chapter Jumper dropdown
    const jumper = document.getElementById('chapter-jumper');
    if (jumper) {
      jumper.addEventListener('change', e => {
        const target = e.target.value;
        if (target) window.location.href = target;
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
