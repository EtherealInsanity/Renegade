/* ==========================================================================
   Renegade Reader - Client Side Reader Engine
   State persistence, 13-theme manager, typography controls & local notes
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

    // Update UI controls if present
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
          if (statusLabel) statusLabel.textContent = 'Note cleared.';
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

  // Keyboard navigation
  function initKeyboardNav() {
    document.addEventListener('keydown', e => {
      // Don't trigger if typing in textarea or input
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
    const closeBtn = document.getElementById('btn-close-settings');
    const drawer = document.getElementById('settings-drawer');
    const backdrop = document.getElementById('drawer-backdrop');

    function openDrawer() {
      if (drawer) drawer.classList.add('open');
      if (backdrop) backdrop.classList.add('active');
    }

    function closeDrawer() {
      if (drawer) drawer.classList.remove('open');
      if (backdrop) backdrop.classList.remove('active');
    }

    if (settingsBtn) settingsBtn.addEventListener('click', openDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (backdrop) backdrop.addEventListener('click', closeDrawer);

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
  });
})();
