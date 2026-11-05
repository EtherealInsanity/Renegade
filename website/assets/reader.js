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

  // Reading progress tracking with Anime.js smooth interpolation
  let progressAnim = null;
  function updateProgress() {
    const h = document.documentElement;
    const b = document.body;
    const st = 'scrollTop';
    const sh = 'scrollHeight';
    const scrollMax = (h[sh] || b[sh]) - h.clientHeight;
    const percent = scrollMax > 0 ? ((h[st] || b[st]) / scrollMax) * 100 : 0;
    const bar = document.getElementById('progress-bar');
    if (bar) {
      const clamped = Math.min(100, Math.max(0, percent));
      if (window.anime) {
        if (progressAnim) progressAnim.pause();
        progressAnim = anime({
          targets: bar,
          width: clamped + '%',
          duration: 120,
          easing: 'easeOutQuad'
        });
      } else {
        bar.style.width = clamped + '%';
      }
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

  // ==========================================================================
  // Cultivator In-Reader Highlights & Notes Engine (5 Colors & Cloud Sync)
  // ==========================================================================
  const STORAGE_KEY_HIGHLIGHTS = 'renegade_highlights';
  let floatingToolbar = null;
  let activeSelectionRange = null;
  let noteModalOverlay = null;

  function getStoredHighlights() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_HIGHLIGHTS);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.error('Failed to parse highlights:', e);
      return {};
    }
  }

  function saveStoredHighlights(highlights) {
    try {
      localStorage.setItem(STORAGE_KEY_HIGHLIGHTS, JSON.stringify(highlights));
      syncHighlightsToCloud(highlights);
    } catch (e) {
      console.error('Failed to save highlights:', e);
    }
  }

  async function syncHighlightsToCloud(highlights) {
    try {
      const walineUserRaw = localStorage.getItem('WALINE_USER');
      let token = '';
      if (walineUserRaw) {
        try {
          const u = JSON.parse(walineUserRaw);
          token = u.token || '';
        } catch (_) {}
      }
      if (!token) return; // Guest mode - local only until authenticated

      await fetch('/api/highlights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ highlights })
      });
    } catch (_) {
      // Offline or function not bound - local storage remains source of truth
    }
  }

  // Expose global helper for account page & extensions
  window.RenegadeHighlights = {
    getAll: getStoredHighlights,
    saveAll: saveStoredHighlights,
    sync: syncHighlightsToCloud
  };

  function createFloatingToolbar() {
    if (floatingToolbar) return floatingToolbar;
    const bar = document.createElement('div');
    bar.id = 'highlight-floating-toolbar';
    bar.className = 'highlight-floating-toolbar';
    bar.innerHTML = `
      <div class="highlight-color-picker">
        <button class="hl-color-dot" data-color="gold" title="Golden Core (Gold)" aria-label="Golden Core"></button>
        <button class="hl-color-dot" data-color="jade" title="Jade Wood (Green)" aria-label="Jade Wood"></button>
        <button class="hl-color-dot" data-color="crimson" title="Slaughter Red (Crimson)" aria-label="Slaughter Red"></button>
        <button class="hl-color-dot" data-color="spirit" title="Spirit Blue (Cyan)" aria-label="Spirit Blue"></button>
        <button class="hl-color-dot" data-color="purple" title="Purple Mist (Violet)" aria-label="Purple Mist"></button>
      </div>
      <button class="hl-btn" id="hl-btn-add-note" title="Add Note">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        <span>Note</span>
      </button>
      <button class="hl-btn" id="hl-btn-copy" title="Copy Text">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
        <span>Copy</span>
      </button>
      <button class="hl-btn" id="hl-btn-dismiss" title="Dismiss" style="padding: 4px 6px;">✕</button>
    `;
    document.body.appendChild(bar);
    floatingToolbar = bar;

    bar.querySelectorAll('.hl-color-dot').forEach(dot => {
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        const color = dot.getAttribute('data-color') || 'gold';
        applySelectionHighlight(color);
      });
    });

    const noteBtn = bar.querySelector('#hl-btn-add-note');
    if (noteBtn) {
      noteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const hl = applySelectionHighlight('gold');
        if (hl) {
          openNoteModal(hl);
        }
      });
    }

    const copyBtn = bar.querySelector('#hl-btn-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activeSelectionRange) {
          const text = activeSelectionRange.toString();
          navigator.clipboard.writeText(text).then(() => {
            hideFloatingToolbar();
          }).catch(() => {});
        }
      });
    }

    const dismissBtn = bar.querySelector('#hl-btn-dismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        hideFloatingToolbar();
        window.getSelection()?.removeAllRanges();
      });
    }

    return bar;
  }

  function showFloatingToolbar(range) {
    if (!range) return;
    const bar = createFloatingToolbar();
    activeSelectionRange = range.cloneRange();
    const rect = range.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) return;

    bar.style.display = 'flex';
    const top = rect.top + window.scrollY - 10;
    const left = rect.left + window.scrollX + (rect.width / 2);

    const barWidth = 280;
    const minLeft = (barWidth / 2) + 12;
    const maxLeft = window.innerWidth - (barWidth / 2) - 12;
    const clampedLeft = Math.max(minLeft, Math.min(maxLeft, left));

    bar.style.top = `${top}px`;
    bar.style.left = `${clampedLeft}px`;
  }

  function hideFloatingToolbar() {
    if (floatingToolbar) {
      floatingToolbar.style.display = 'none';
    }
    activeSelectionRange = null;
  }

  function applySelectionHighlight(color) {
    if (!activeSelectionRange) return null;
    const text = activeSelectionRange.toString().trim();
    if (!text) return null;

    const chapterMeta = document.querySelector('meta[name="chapter-number"]');
    const chapterNum = chapterMeta ? parseInt(chapterMeta.getAttribute('content'), 10) : 1;
    const hlId = `hl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    let paragraphIndex = -1;
    let node = activeSelectionRange.startContainer;
    while (node && node !== document.body) {
      if (node.nodeName === 'P' && node.parentElement?.classList.contains('chapter-body')) {
        const paragraphs = Array.from(document.querySelectorAll('.chapter-body p'));
        paragraphIndex = paragraphs.indexOf(node);
        break;
      }
      node = node.parentNode;
    }

    const hlObj = {
      id: hlId,
      chapter: chapterNum,
      text: text,
      color: color || 'gold',
      note: '',
      isPublic: true,
      timestamp: Date.now(),
      paragraphIndex: paragraphIndex
    };

    try {
      const mark = document.createElement('mark');
      mark.className = `renegade-highlight color-${hlObj.color}`;
      mark.setAttribute('data-hl-id', hlId);
      mark.setAttribute('data-color', hlObj.color);
      mark.setAttribute('tabindex', '0');
      mark.setAttribute('title', 'Click to view enlightenment note');

      activeSelectionRange.surroundContents(mark);
      attachHighlightClick(mark, hlObj);
    } catch (e) {
      wrapRangeCrossNode(activeSelectionRange, hlObj);
    }

    const all = getStoredHighlights();
    all[hlId] = hlObj;
    saveStoredHighlights(all);

    hideFloatingToolbar();
    window.getSelection()?.removeAllRanges();
    return hlObj;
  }

  function wrapRangeCrossNode(range, hlObj) {
    try {
      const fragment = range.extractContents();
      const mark = document.createElement('mark');
      mark.className = `renegade-highlight color-${hlObj.color}`;
      mark.setAttribute('data-hl-id', hlObj.id);
      mark.setAttribute('data-color', hlObj.color);
      mark.setAttribute('tabindex', '0');
      mark.setAttribute('title', 'Click to view enlightenment note');
      mark.appendChild(fragment);
      range.insertNode(mark);
      attachHighlightClick(mark, hlObj);
    } catch (err) {
      console.warn('Cross-node highlight fallback failed:', err);
    }
  }

  function openNoteModal(hlObj) {
    if (!hlObj) return;
    if (!noteModalOverlay) {
      const overlay = document.createElement('div');
      overlay.id = 'hl-note-modal-overlay';
      overlay.className = 'hl-modal-overlay';
      overlay.style.display = 'none';
      overlay.innerHTML = `
        <div class="hl-modal-card" role="dialog" aria-modal="true">
          <div class="hl-modal-header">
            <h4>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              Enlightenment Insight Note
            </h4>
            <button class="icon-btn" id="hl-modal-close" aria-label="Close Note Modal">✕</button>
          </div>
          <blockquote class="hl-modal-quote" id="hl-modal-quote"></blockquote>
          <textarea class="hl-modal-textarea" id="hl-modal-textarea" placeholder="Record your cultivation insights, realizations, or daoist thoughts on this passage..."></textarea>
          <div class="hl-modal-options">
            <div class="highlight-color-picker" id="hl-modal-colors">
              <button class="hl-color-dot" data-color="gold" title="Golden Core"></button>
              <button class="hl-color-dot" data-color="jade" title="Jade Wood"></button>
              <button class="hl-color-dot" data-color="crimson" title="Slaughter Red"></button>
              <button class="hl-color-dot" data-color="spirit" title="Spirit Blue"></button>
              <button class="hl-color-dot" data-color="purple" title="Purple Mist"></button>
            </div>
            <label class="hl-public-toggle">
              <input type="checkbox" id="hl-modal-public" checked>
              <span>Public on Cultivator Profile</span>
            </label>
          </div>
          <div class="hl-modal-actions">
            <button class="icon-btn" id="hl-modal-delete" style="color: var(--accent-color); border-color: rgba(239, 68, 68, 0.4);">Delete Highlight</button>
            <button class="icon-btn" id="hl-modal-save" style="border-color: var(--accent-color); color: var(--accent-color); font-weight: 600;">Save Note</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      noteModalOverlay = overlay;

      overlay.querySelector('#hl-modal-close')?.addEventListener('click', closeNoteModal);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeNoteModal();
      });
    }

    const overlay = noteModalOverlay;
    const quoteEl = overlay.querySelector('#hl-modal-quote');
    const textarea = overlay.querySelector('#hl-modal-textarea');
    const publicCheckbox = overlay.querySelector('#hl-modal-public');
    const colorPicker = overlay.querySelector('#hl-modal-colors');
    const saveBtn = overlay.querySelector('#hl-modal-save');
    const deleteBtn = overlay.querySelector('#hl-modal-delete');

    if (quoteEl) quoteEl.textContent = `“${hlObj.text}”`;
    if (textarea) {
      textarea.value = hlObj.note || '';
      setTimeout(() => textarea.focus(), 50);
    }
    if (publicCheckbox) publicCheckbox.checked = hlObj.isPublic !== false;

    let selectedColor = hlObj.color || 'gold';
    function updateActiveDot() {
      colorPicker?.querySelectorAll('.hl-color-dot').forEach(dot => {
        if (dot.getAttribute('data-color') === selectedColor) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
    }
    updateActiveDot();

    colorPicker?.querySelectorAll('.hl-color-dot').forEach(dot => {
      dot.onclick = () => {
        selectedColor = dot.getAttribute('data-color') || 'gold';
        updateActiveDot();
      };
    });

    if (saveBtn) {
      saveBtn.onclick = () => {
        hlObj.note = textarea ? textarea.value.trim() : '';
        hlObj.color = selectedColor;
        hlObj.isPublic = publicCheckbox ? publicCheckbox.checked : true;
        hlObj.timestamp = Date.now();

        document.querySelectorAll(`mark[data-hl-id="${hlObj.id}"]`).forEach(m => {
          m.className = `renegade-highlight color-${hlObj.color} ${hlObj.note ? 'has-note' : ''}`;
          m.setAttribute('data-color', hlObj.color);
          m.setAttribute('title', hlObj.note ? `Note: ${hlObj.note}` : 'Click to view enlightenment note');
        });

        const all = getStoredHighlights();
        all[hlObj.id] = hlObj;
        saveStoredHighlights(all);
        closeNoteModal();
      };
    }

    if (deleteBtn) {
      deleteBtn.onclick = () => {
        document.querySelectorAll(`mark[data-hl-id="${hlObj.id}"]`).forEach(m => {
          const parent = m.parentNode;
          while (m.firstChild) {
            parent.insertBefore(m.firstChild, m);
          }
          parent.removeChild(m);
        });

        const all = getStoredHighlights();
        delete all[hlObj.id];
        saveStoredHighlights(all);
        closeNoteModal();
      };
    }

    overlay.style.display = 'flex';
  }

  function closeNoteModal() {
    if (noteModalOverlay) {
      noteModalOverlay.style.display = 'none';
    }
  }

  function attachHighlightClick(mark, hlObj) {
    mark.addEventListener('click', (e) => {
      e.stopPropagation();
      openNoteModal(hlObj);
    });
    mark.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openNoteModal(hlObj);
      }
    });
  }

  function restoreHighlightsForChapter(chapterNum) {
    if (!chapterNum) return;
    const chapterBody = document.querySelector('.chapter-body');
    if (!chapterBody) return;

    const all = getStoredHighlights();
    const chapterHighlights = Object.values(all).filter(h => h.chapter === chapterNum);
    if (!chapterHighlights.length) return;

    const paragraphs = Array.from(chapterBody.querySelectorAll('p'));

    chapterHighlights.forEach(hl => {
      if (!hl.text) return;
      let targetP = (hl.paragraphIndex >= 0 && hl.paragraphIndex < paragraphs.length) ? paragraphs[hl.paragraphIndex] : null;

      if (!targetP || !targetP.textContent.includes(hl.text)) {
        targetP = paragraphs.find(p => p.textContent.includes(hl.text));
      }

      if (targetP) {
        if (targetP.querySelector(`mark[data-hl-id="${hl.id}"]`)) return;

        const walker = document.createTreeWalker(targetP, NodeFilter.SHOW_TEXT, null);
        let textNode;
        while ((textNode = walker.nextNode())) {
          const idx = textNode.textContent.indexOf(hl.text);
          if (idx !== -1) {
            try {
              const range = document.createRange();
              range.setStart(textNode, idx);
              range.setEnd(textNode, idx + hl.text.length);

              const mark = document.createElement('mark');
              mark.className = `renegade-highlight color-${hl.color || 'gold'} ${hl.note ? 'has-note' : ''}`;
              mark.setAttribute('data-hl-id', hl.id);
              mark.setAttribute('data-color', hl.color || 'gold');
              mark.setAttribute('tabindex', '0');
              mark.setAttribute('title', hl.note ? `Note: ${hl.note}` : 'Click to view enlightenment note');

              range.surroundContents(mark);
              attachHighlightClick(mark, hl);
              break;
            } catch (_) {}
          }
        }
      }
    });

    handleDeepLinkAnchor();
  }

  function handleDeepLinkAnchor() {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#hl-')) {
      const hlId = hash.substring(1);
      setTimeout(() => {
        const mark = document.querySelector(`mark[data-hl-id="${hlId}"]`);
        if (mark) {
          mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
          mark.classList.add('active-pulse');
          setTimeout(() => mark.classList.remove('active-pulse'), 5500);
        }
      }, 350);
    }
  }

  function initHighlights(chapterNum) {
    restoreHighlightsForChapter(chapterNum);

    const chapterBody = document.querySelector('.chapter-body');
    if (!chapterBody) return;

    let selectionTimer = null;
    function handleSelectionCheck() {
      clearTimeout(selectionTimer);
      selectionTimer = setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.rangeCount) {
          hideFloatingToolbar();
          return;
        }

        const range = sel.getRangeAt(0);
        const text = sel.toString().trim();
        if (text.length < 2) {
          hideFloatingToolbar();
          return;
        }

        const common = range.commonAncestorContainer;
        const isInsideBody = chapterBody.contains(common.nodeType === 3 ? common.parentNode : common);
        if (!isInsideBody) {
          hideFloatingToolbar();
          return;
        }

        showFloatingToolbar(range);
      }, 120);
    }

    document.addEventListener('selectionchange', handleSelectionCheck);
    chapterBody.addEventListener('mouseup', handleSelectionCheck);
    chapterBody.addEventListener('touchend', handleSelectionCheck);

    document.addEventListener('pointerdown', (e) => {
      if (floatingToolbar && !floatingToolbar.contains(e.target)) {
        if (!window.getSelection()?.toString().trim()) {
          hideFloatingToolbar();
        }
      }
    });

    window.addEventListener('hashchange', handleDeepLinkAnchor);
  }

  // Chapter Discussions (Waline Comments with Lazy Load)
  function initComments() {
    const threadContainer = document.getElementById('waline-thread-container') || document.getElementById('waline') || document.getElementById('giscus-thread-container');
    if (!threadContainer) return;

    const path = threadContainer.getAttribute('data-path') || threadContainer.getAttribute('data-term') || window.location.pathname;

    function triggerComments() {
      if (window.loadWaline) {
        window.loadWaline(threadContainer, path);
      } else if (window.loadGiscus) {
        window.loadGiscus(threadContainer, path);
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
          triggerComments();
        }
      });
    });

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            obs.disconnect();
            triggerComments();
          }
        });
      }, { rootMargin: '300px 0px' });
      observer.observe(threadContainer);
    } else {
      triggerComments();
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
        if (prev && prev.getAttribute('href') && !prev.classList.contains('disabled') && prev.getAttribute('href') !== '#') {
          window.location.href = prev.getAttribute('href');
        }
      } else if (e.key === 'ArrowRight') {
        const next = document.getElementById('nav-next-btn');
        if (next && next.getAttribute('href') && !next.classList.contains('disabled') && next.getAttribute('href') !== '#') {
          window.location.href = next.getAttribute('href');
        }
      } else if (e.key === 'c' || e.key === 'C' || e.key === 't' || e.key === 'T') {
        e.preventDefault();
        toggleChaptersDrawer();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        if (window.toggleFullscreen) window.toggleFullscreen();
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
      if (target.closest('.chapters-drawer, .settings-drawer, .reader-header, .cultivator-notes-section, select, button, input, textarea, a')) {
        return;
      }

      // Swipe threshold: fast (< 450ms), horizontal distance > 75px, angle > 2.2x vertical
      if (elapsed < 450 && Math.abs(diffX) > 75 && Math.abs(diffX) > Math.abs(diffY) * 2.2) {
        if (diffX < 0) {
          // Swipe Left -> Next chapter
          const nextBtn = document.getElementById('nav-next-btn');
          if (nextBtn && nextBtn.getAttribute('href') && !nextBtn.classList.contains('disabled') && nextBtn.getAttribute('href') !== '#') {
            showSwipeHint('Next Chapter →');
            setTimeout(() => { window.location.href = nextBtn.getAttribute('href'); }, 150);
          }
        } else {
          // Swipe Right -> Prev chapter
          const prevBtn = document.getElementById('nav-prev-btn');
          if (prevBtn && prevBtn.getAttribute('href') && !prevBtn.classList.contains('disabled') && prevBtn.getAttribute('href') !== '#') {
            showSwipeHint('← Previous Chapter');
            setTimeout(() => { window.location.href = prevBtn.getAttribute('href'); }, 150);
          }
        }
      }
      startX = 0;
      startY = 0;
    }, { passive: true });
  }

  // Floating Back to Top button
  function initBackToTop() {
    const btn = document.getElementById('btn-back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    }, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Fullscreen Reading Mode
  function initFullscreen() {
    function isFs() {
      return !!(document.fullscreenElement || document.webkitFullscreenElement || document.body.classList.contains('fullscreen-active'));
    }

    function updateFsUI(active) {
      document.body.classList.toggle('fullscreen-active', active);
      const btns = [document.getElementById('btn-toggle-fullscreen'), document.getElementById('btn-drawer-fullscreen')];
      btns.forEach(btn => {
        if (!btn) return;
        const enterIcon = btn.querySelector('.icon-fs-enter');
        const exitIcon = btn.querySelector('.icon-fs-exit');
        if (enterIcon) enterIcon.style.display = active ? 'none' : '';
        if (exitIcon) exitIcon.style.display = active ? '' : 'none';
        const label = btn.querySelector('.drawer-fs-label');
        if (label) label.textContent = active ? 'Exit Fullscreen' : 'Fullscreen';
        btn.setAttribute('title', active ? 'Exit Fullscreen (Press F or Esc)' : 'Fullscreen (Press F)');
        btn.setAttribute('aria-label', active ? 'Exit Fullscreen' : 'Fullscreen');
      });
    }

    function toggleFs() {
      const doc = document.documentElement;
      if (!isFs()) {
        if (doc.requestFullscreen) {
          doc.requestFullscreen().catch(() => updateFsUI(true));
        } else if (doc.webkitRequestFullscreen) {
          doc.webkitRequestFullscreen();
        } else {
          updateFsUI(true);
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => updateFsUI(false));
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else {
          updateFsUI(false);
        }
      }
    }

    let headerFsBtn = document.getElementById('btn-toggle-fullscreen');
    const headerRight = document.querySelector('.reader-header .header-right');
    const settingsBtn = document.getElementById('btn-open-settings');
    if (!headerFsBtn && headerRight && settingsBtn) {
      headerFsBtn = document.createElement('button');
      headerFsBtn.id = 'btn-toggle-fullscreen';
      headerFsBtn.className = 'icon-btn';
      headerFsBtn.setAttribute('aria-label', 'Fullscreen');
      headerFsBtn.setAttribute('title', 'Fullscreen (Press F)');
      headerFsBtn.innerHTML = `
        <svg class="icon-fs-enter" xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
        <svg class="icon-fs-exit" xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none;"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
      `;
      headerRight.insertBefore(headerFsBtn, settingsBtn);
    }

    if (headerFsBtn) headerFsBtn.addEventListener('click', toggleFs);

    const drawerFsBtn = document.getElementById('btn-drawer-fullscreen');
    if (drawerFsBtn) {
      drawerFsBtn.addEventListener('click', () => {
        toggleFs();
        if (typeof closeSettingsDrawer === 'function') closeSettingsDrawer();
      });
    }

    ['fullscreenchange', 'webkitfullscreenchange'].forEach(evt => {
      document.addEventListener(evt, () => {
        const active = !!(document.fullscreenElement || document.webkitFullscreenElement);
        updateFsUI(active);
      });
    });

    window.toggleFullscreen = toggleFs;
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
      initHighlights(currentChapter);
    } else {
      initHighlights(1);
    }

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();

    // Render user avatar in reader header if uploaded/logged in
    try {
      const customAvatar = localStorage.getItem('renegade_user_avatar');
      let avatarUrl = customAvatar;
      if (!avatarUrl) {
        const walineUser = JSON.parse(localStorage.getItem('WALINE_USER') || '{}');
        avatarUrl = walineUser.avatar;
      }
      if (avatarUrl) {
        const profileBtn = document.getElementById('btn-cultivator-profile');
        if (profileBtn) {
          profileBtn.innerHTML = `<img class="reader-header-avatar" src="${avatarUrl}" alt="Cultivator Avatar">`;
        }
      }
    } catch (_) {}

    // Drawer Selectors
    const settingsBtn = document.getElementById('btn-open-settings');
    const closeSettingsBtn = document.getElementById('btn-close-settings');
    const settingsDrawer = document.getElementById('settings-drawer');

    const chaptersBtn = document.getElementById('btn-open-chapters');
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
    if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', closeSettingsDrawer);

    if (chaptersBtn) chaptersBtn.addEventListener('click', openChaptersDrawer);
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

        // Build Chapters View and Volumes View
        let chListHtml = '';
        let volListHtml = '';

        cachedBooks.forEach(b => {
          const bChapters = chaptersByBook[b.book] || [];
          const isCurrentBook = b.book === currentBookNum;

          chListHtml += `<div class="drawer-book-divider" id="drawer-book-anchor-${b.book}">Book ${b.book}: ${b.title} (${bChapters.length} chs)</div>`;

          bChapters.forEach(ch => {
            const isActive = ch.chapter === currentChapterNum;
            const activeClass = isActive ? ' active' : '';
            const activeAttr = isActive ? ' id="drawer-active-chapter"' : '';
            let displayTitle = ch.title;
            if (!displayTitle.toLowerCase().startsWith('chapter ' + ch.chapter)) {
              displayTitle = 'Ch. ' + ch.chapter + ' – ' + displayTitle;
            }

            chListHtml += `<a href="/read/ch_${ch.chapter}" class="drawer-ch-item${activeClass}"${activeAttr} data-num="${ch.chapter}" data-title="${ch.title.toLowerCase()}"><span class="drawer-ch-title">${displayTitle}</span><span class="drawer-ch-num">#${ch.chapter}</span></a>`;
          });

          const activeVolClass = isCurrentBook ? ' active' : '';
          const startCh = b.start || (bChapters[0] ? bChapters[0].chapter : 1);
          const endCh = b.end || (bChapters[bChapters.length - 1] ? bChapters[bChapters.length - 1].chapter : bChapters.length);
          volListHtml += `
            <div class="drawer-volume-card${activeVolClass}" data-book-num="${b.book}">
              <div class="drawer-volume-title">Book ${b.book}: ${b.title}</div>
              <div class="drawer-volume-meta">Chapters ${startCh} – ${endCh} · ${bChapters.length} chapters</div>
            </div>
          `;
        });

        const html = `
          <div class="drawer-tabs">
            <button type="button" class="drawer-tab-btn active" id="drawer-tab-btn-chapters">Chapters</button>
            <button type="button" class="drawer-tab-btn" id="drawer-tab-btn-volumes">Volumes</button>
          </div>
          <div id="drawer-chapters-view" class="drawer-view-panel">
            ${chListHtml}
          </div>
          <div id="drawer-volumes-view" class="drawer-view-panel" style="display: none;">
            ${volListHtml}
          </div>
        `;

        if (volumesContainer) {
          volumesContainer.innerHTML = html;
        }
        isChapterDrawerLoaded = true;
        isChapterDrawerLoading = false;

        // Tab Switching logic
        const tabBtnChapters = document.getElementById('drawer-tab-btn-chapters');
        const tabBtnVolumes = document.getElementById('drawer-tab-btn-volumes');
        const chaptersView = document.getElementById('drawer-chapters-view');
        const volumesView = document.getElementById('drawer-volumes-view');

        function switchTab(target) {
          if (target === 'chapters') {
            tabBtnChapters.classList.add('active');
            tabBtnVolumes.classList.remove('active');
            chaptersView.style.display = 'flex';
            volumesView.style.display = 'none';
            focusActiveChapter();
          } else {
            tabBtnVolumes.classList.add('active');
            tabBtnChapters.classList.remove('active');
            volumesView.style.display = 'block';
            chaptersView.style.display = 'none';
          }
        }

        if (tabBtnChapters) tabBtnChapters.addEventListener('click', () => switchTab('chapters'));
        if (tabBtnVolumes) tabBtnVolumes.addEventListener('click', () => switchTab('volumes'));

        // Volume card click: switch to Chapters view and scroll to volume anchor
        volumesContainer.querySelectorAll('.drawer-volume-card').forEach(card => {
          card.addEventListener('click', () => {
            const bNum = card.getAttribute('data-book-num');
            switchTab('chapters');
            const anchor = document.getElementById('drawer-book-anchor-' + bNum);
            if (anchor) {
              anchor.scrollIntoView({ block: 'start', behavior: 'smooth' });
            }
          });
        });

        // Setup live search
        if (searchInput) {
          searchInput.addEventListener('input', e => {
            const q = e.target.value.toLowerCase().trim();
            if (clearSearchBtn) {
              clearSearchBtn.style.display = q ? 'block' : 'none';
            }

            if (q) switchTab('chapters');

            const items = chaptersView.querySelectorAll('.drawer-ch-item');
            const dividers = chaptersView.querySelectorAll('.drawer-book-divider');
            let totalVisible = 0;

            items.forEach(item => {
              if (!q) {
                item.style.display = 'flex';
                totalVisible++;
              } else {
                const title = item.getAttribute('data-title') || '';
                const num = item.getAttribute('data-num') || '';
                if (title.includes(q) || num === q || ('chapter ' + num).includes(q)) {
                  item.style.display = 'flex';
                  totalVisible++;
                } else {
                  item.style.display = 'none';
                }
              }
            });

            dividers.forEach(div => {
              div.style.display = q ? 'none' : 'block';
            });

            let emptyMsg = document.getElementById('drawer-no-results');
            if (totalVisible === 0) {
              if (!emptyMsg) {
                emptyMsg = document.createElement('div');
                emptyMsg.id = 'drawer-no-results';
                emptyMsg.className = 'drawer-empty-search';
                emptyMsg.textContent = 'No chapters found matching "' + q + '".';
                chaptersView.appendChild(emptyMsg);
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
    initBackToTop();
    initFullscreen();
    initComments();

    // Anime.js entrance animation for header
    if (window.anime && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      anime({
        targets: '.reader-header',
        opacity: [0, 1],
        duration: 500,
        easing: 'easeOutQuad'
      });
    }

    // Button micro-interactions with Anime.js
    document.querySelectorAll('.icon-btn, .chapter-end-btn, .floating-back-to-top').forEach(btn => {
      btn.addEventListener('pointerdown', () => {
        if (window.anime) {
          anime({ targets: btn, scale: 0.94, duration: 80, easing: 'easeOutQuad' });
        }
      });
      const resetScale = () => {
        if (window.anime) {
          anime({ targets: btn, scale: 1, duration: 160, easing: 'easeOutElastic(1, .5)' });
        }
      };
      btn.addEventListener('pointerup', resetScale);
      btn.addEventListener('pointerleave', resetScale);
    });

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
