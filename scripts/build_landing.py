#!/usr/bin/env python3
"""
Renegade Reader - Landing Page & Chapters Catalog Builder
Generates:
  1. website/index.html: Clean homepage displaying novel cover, name, volumes, and Read/Download buttons
  2. website/chapters.html: Dedicated chapters page categorised in 13 collapsible canonical volumes
  3. website/download.html: Offline EPUB download page
"""

import os
import json
import hashlib

def main():
    meta_chapters = "website/meta/chapters.json"
    meta_books = "website/meta/books.json"
    meta_stats = "website/meta/stats.json"

    with open(meta_chapters, "r", encoding="utf-8") as f:
        chapters = json.load(f)
    with open(meta_books, "r", encoding="utf-8") as f:
        books = json.load(f)
    with open(meta_stats, "r", encoding="utf-8") as f:
        stats = json.load(f)

    # Compute SHA256 and size of EPUB
    epub_path = "website/download/Renegade_Immortal.epub"
    if os.path.exists(epub_path):
        hasher = hashlib.sha256()
        with open(epub_path, "rb") as f:
            while chunk := f.read(65536):
                hasher.update(chunk)
        sha256_hash = hasher.hexdigest()
        file_size_mb = f"{os.path.getsize(epub_path) / (1024*1024):.1f} MB"
    else:
        sha256_hash = "N/A"
        file_size_mb = "~9.3 MB"

    # Group chapters by book
    chapters_by_book = {b["book"]: [] for b in books}
    for ch in chapters:
        b_num = ch["book"]
        if b_num in chapters_by_book:
            chapters_by_book[b_num].append(ch)

    # Build Chapters Page (TOC) Accordions HTML
    accordions_html = []
    pills_html = []

    for b in books:
        b_num = b["book"]
        b_title = b["title"]
        b_chapters = chapters_by_book.get(b_num, [])
        ch_count = len(b_chapters)
        start_ch = b["start"]
        end_ch = b["end"]
        b_words = sum(ch.get("word_count", 0) for ch in b_chapters)

        pills_html.append(f'<a href="#book-{b_num}" class="book-pill">Book {b_num} ({ch_count} chs)</a>')

        # Open the first book by default for immediate preview
        open_attr = "open" if b_num == 1 else ""

        ch_items_html = []
        for ch in b_chapters:
            ch_num = ch["chapter"]
            title_text = ch["title"]
            if title_text.lower().startswith(f"chapter {ch_num}"):
                display_title = title_text
            else:
                display_title = f"Ch. {ch_num} – {title_text}"

            ch_items_html.append(
                f'<a href="/read/ch_{ch_num}" class="chapter-item-link" data-title="{title_text.lower()}">'
                f'{display_title}</a>'
            )

        accordion_block = f"""
        <details id="book-{b_num}" class="book-accordion" data-book-num="{b_num}" {open_attr}>
          <summary class="book-header">
            <div class="book-title-group">
              <h3>Book {b_num}: {b_title}</h3>
              <span class="book-subtitle">Chapters {start_ch} – {end_ch} · {ch_count} chs · {b_words:,} words</span>
            </div>
            <svg class="book-toggle-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </summary>
          <div class="chapter-grid" id="grid-book-{b_num}">
            {"".join(ch_items_html)}
          </div>
        </details>
        """
        accordions_html.append(accordion_block)

    books_rendered = "\n".join(accordions_html)
    pills_rendered = "\n".join(pills_html)

    # =========================================================================
    # 1. Generate website/index.html (Clean homepage)
    # Displays ONLY book cover, name, volumes, along with read & download buttons
    # =========================================================================
    index_html = f"""<!DOCTYPE html>
<html lang="en" data-theme="slaughter">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#0c0d12">
  <title>Renegade Immortal (仙逆) - Complete Web Novel Reader</title>
  <meta name="description" content="Read Renegade Immortal (仙逆) by Er Gen online. Fast, clean, ad-free reader across all 13 canonical books and 2,088 chapters.">
  <meta property="og:title" content="Renegade Immortal (仙逆) - Complete Web Novel Reader">
  <meta property="og:description" content="Read all 2,088 chapters of Renegade Immortal (仙逆) online. Ad-free, 13 custom Xianxia themes, instant offline download.">
  <meta property="og:image" content="/assets/cover.jpg">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="/assets/cover.jpg">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Renegade">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="stylesheet" href="/assets/themes.css">
  <link rel="stylesheet" href="/assets/landing.css">
  <link rel="icon" type="image/png" href="/assets/favicon.png">
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
</head>
<body>

  <!-- Full-Screen Landscape Atmospheric Background (Dual Wallpaper with Switcher) -->
  <div class="landing-bg-container" id="landing-bg" aria-hidden="true">
    <picture class="landing-bg-img active" id="bg-img-1">
      <source srcset="/assets/bg-desktop.webp" type="image/webp">
      <img src="/assets/bg-desktop.jpg" alt="Renegade Immortal Landscape Wallpaper 1" class="bg-img" loading="eager" fetchpriority="high">
    </picture>
    <picture class="landing-bg-img" id="bg-img-2">
      <source srcset="/assets/bg-waner.webp" type="image/webp">
      <img src="/assets/bg-waner.jpg" alt="Renegade Immortal Landscape Wallpaper 2" class="bg-img" loading="lazy">
    </picture>
    <div class="landing-bg-overlay"></div>
  </div>

  <!-- Landing Top Nav (PWA Install Bar when prompted) -->
  <header class="landing-nav" id="landing-nav" style="display: none;">
    <div class="nav-links">
      <button id="btn-pwa-install" class="nav-link" style="display: none; background: none; border: 1px solid var(--accent-color); color: var(--accent-color); padding: 6px 12px; border-radius: var(--border-radius); cursor: pointer;" aria-label="Install App">
        📥 Install App
      </button>
    </div>
  </header>

  <!-- Floating Quick-Action Side Dock (LOTM-Reader Inspired) -->
  <aside class="floating-side-dock" id="floating-side-dock" aria-label="Quick Actions">
    <div class="dock-item" data-tip="Switch Background">
      <button id="btn-toggle-bg" class="dock-btn" aria-label="Switch Background Wallpaper">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
      </button>
    </div>
    <div class="dock-item" data-tip="Cycle Dao Theme">
      <button id="btn-toggle-theme" class="dock-btn" aria-label="Cycle Dao Theme">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
      </button>
    </div>
    <div class="dock-item" data-tip="Community Discussion">
      <a href="#reviews" class="dock-btn" aria-label="Community Discussion">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </a>
    </div>
    <div class="dock-item" data-tip="Install App" id="dock-install-item" style="display: none;">
      <button id="btn-dock-install" class="dock-btn" aria-label="Install App">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/><polyline points="7 11 12 16 17 11"/><line x1="12" y1="4" x2="12" y2="16"/></svg>
      </button>
    </div>
  </aside>

  <!-- Focused Hero Section (LOTM-Reader 2-Column Desktop, Stacked Mobile) -->
  <main class="hero-section">
    <div class="hero-cover">
      <div class="hero-cover-tilt-wrap" id="hero-cover-wrap">
        <div class="hero-cover-sheen" id="hero-cover-sheen"></div>
        <picture>
          <source srcset="/assets/cover.webp" type="image/webp">
          <img src="/assets/cover.jpg" alt="Renegade Immortal (仙逆) Novel Cover Art" width="200" height="285" class="hero-cover-img" loading="eager">
        </picture>
      </div>
    </div>

    <div class="hero-content">
      <h1 class="novel-title">Renegade Immortal<span class="novel-chinese-title">仙逆</span></h1>
      <div class="novel-author">By <strong>Er Gen (耳根)</strong> · Official Translation</div>

      <!-- Action Buttons: Read & Download (with automatic Resume for returning readers) -->
      <div class="hero-cta-buttons">
        <a id="btn-hero-primary" href="/read/ch_1" class="btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <span id="hero-primary-text">Read Now</span>
        </a>
        <a href="/download" class="btn-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Download
        </a>
      </div>
    </div>
  </main>

  <!-- Reviews & Community Discussions Section -->
  <section class="reviews-section" id="reviews">
    <!-- Live Community Reviews & Discussions (Waline) -->
    <div class="landing-assembly-container">
      <div class="landing-assembly-header">
        <div>
          <h3>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Community Reviews & Discussion
          </h3>
          <span class="landing-assembly-sub">Share your thoughts, reviews, and discuss the novel with fellow readers.</span>
        </div>
        <span class="brand-badge">Waline Community</span>
      </div>
      <div id="landing-waline-container" class="waline-thread-container" data-path="/">
        <div class="waline-skeleton">
          <div class="waline-spinner"></div>
          <span>Loading discussion...</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="landing-footer">
    <p>Renegade Reader · Unofficial fan reader platform for <em>Renegade Immortal (仙逆)</em> by Er Gen.</p>
    <p>Ad-free, zero trackers, 100% static client-side architecture. Optimized for desktop & mobile.</p>
  </footer>

  <script src="/assets/anime.min.js"></script>
  <script src="/assets/waline-config.js"></script>
  <script>
    // Wallpaper switcher (landscape wallpapers from extra assets)
    const bg1 = document.getElementById('bg-img-1');
    const bg2 = document.getElementById('bg-img-2');
    const btnToggleBg = document.getElementById('btn-toggle-bg');
    let currentBg = localStorage.getItem('renegade_bg_preference') || '1';

    function setBg(choice) {{
      if (choice === '2') {{
        bg1 && bg1.classList.remove('active');
        bg2 && bg2.classList.add('active');
        currentBg = '2';
      }} else {{
        bg2 && bg2.classList.remove('active');
        bg1 && bg1.classList.add('active');
        currentBg = '1';
      }}
      try {{ localStorage.setItem('renegade_bg_preference', currentBg); }} catch(e) {{}}
    }}
    setBg(currentBg);

    if (btnToggleBg) {{
      btnToggleBg.addEventListener('click', () => {{
        setBg(currentBg === '1' ? '2' : '1');
      }});
    }}

    // Dao Theme cycler
    const btnToggleTheme = document.getElementById('btn-toggle-theme');
    if (btnToggleTheme) {{
      const themes = [
        'slaughter', 'bead', 'ancient-god', 'life-death', 'karma',
        'true-false', 'thunder', 'underworld', 'all-seer',
        'dao-ancient', 'seven-colored', 'heaven-trampling', 'ink-scholar'
      ];
      btnToggleTheme.addEventListener('click', () => {{
        const cur = document.documentElement.getAttribute('data-theme') || 'slaughter';
        const idx = themes.indexOf(cur);
        const next = themes[(idx + 1) % themes.length];
        document.documentElement.setAttribute('data-theme', next);
        try {{
          const saved = JSON.parse(localStorage.getItem('renegade_reader_settings') || '{{}}');
          saved.theme = next;
          localStorage.setItem('renegade_reader_settings', JSON.stringify(saved));
        }} catch(e) {{}}
      }});
    }}

    // Restore last read chapter button
    try {{
      const lastRead = JSON.parse(localStorage.getItem('renegade_last_read'));
      if (lastRead && lastRead.chapter) {{
        const primaryBtn = document.getElementById('btn-hero-primary');
        const primaryTxt = document.getElementById('hero-primary-text');
        if (primaryBtn && primaryTxt) {{
          primaryBtn.href = '/read/ch_' + lastRead.chapter;
          primaryTxt.textContent = 'Resume Ch. ' + lastRead.chapter;
        }}
      }}
    }} catch(e) {{}}

    // Apply saved theme on landing page
    try {{
      const saved = JSON.parse(localStorage.getItem('renegade_reader_settings'));
      if (saved && saved.theme) document.documentElement.setAttribute('data-theme', saved.theme);
    }} catch(e) {{}}

    // 3D Cover Tilt & Glare Hover Animation (Enlarges on Hover like LOTM-Reader)
    const coverWrap = document.getElementById('hero-cover-wrap');
    const coverSheen = document.getElementById('hero-cover-sheen');
    if (coverWrap && window.matchMedia('(hover: hover)').matches) {{
      let bounds = null;
      coverWrap.addEventListener('pointerenter', () => {{
        bounds = coverWrap.getBoundingClientRect();
        if (coverSheen) coverSheen.style.opacity = '1';
      }});
      coverWrap.addEventListener('pointermove', (e) => {{
        if (!bounds) bounds = coverWrap.getBoundingClientRect();
        const x = (e.clientX - bounds.left) / bounds.width - 0.5;
        const y = (e.clientY - bounds.top) / bounds.height - 0.5;
        const rotX = -y * 18;
        const rotY = x * 18;
        coverWrap.style.transform = `perspective(1000px) rotateX(${{rotX.toFixed(2)}}deg) rotateY(${{rotY.toFixed(2)}}deg) scale(1.10)`;
        if (coverSheen) {{
          const px = ((x + 0.5) * 100).toFixed(1);
          const py = ((y + 0.5) * 100).toFixed(1);
          coverSheen.style.background = `radial-gradient(circle at ${{px}}% ${{py}}%, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0) 65%)`;
        }}
      }});
      coverWrap.addEventListener('pointerleave', () => {{
        bounds = null;
        if (window.anime) {{
          anime.remove(coverWrap);
          if (coverSheen) anime.remove(coverSheen);
          anime({{
            targets: coverWrap,
            rotateX: 0,
            rotateY: 0,
            scale: 1,
            duration: 600,
            easing: 'easeOutElastic(1, .6)',
            complete: () => {{
              coverWrap.style.transform = '';
            }}
          }});
          if (coverSheen) {{
            anime({{
              targets: coverSheen,
              opacity: 0,
              duration: 350,
              easing: 'easeOutQuad'
            }});
          }}
        }} else {{
          coverWrap.style.transform = '';
          if (coverSheen) coverSheen.style.opacity = '0';
        }}
      }});
    }}

    // Anime.js Staggered Entrance Animation
    if (window.anime && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {{
      anime({{
        targets: [
          '#landing-nav',
          '.hero-cover',
          '.novel-title',
          '.novel-author',
          '.hero-cta-buttons .btn-primary',
          '.hero-cta-buttons .btn-secondary',
          '.floating-side-dock',
          '.landing-assembly-container'
        ],
        opacity: [0, 1],
        translateY: [24, 0],
        delay: anime.stagger(90, {{ start: 80 }}),
        duration: 700,
        easing: 'easeOutCubic'
      }});
    }}

    // Button Micro-interactions
    document.querySelectorAll('.btn-primary, .btn-secondary').forEach(btn => {{
      btn.addEventListener('pointerdown', () => {{
        if (window.anime) anime({{ targets: btn, scale: 0.96, duration: 80, easing: 'easeOutQuad' }});
      }});
      const resetBtn = () => {{
        if (window.anime) anime({{ targets: btn, scale: 1, duration: 180, easing: 'easeOutElastic(1, .5)' }});
      }};
      btn.addEventListener('pointerup', resetBtn);
      btn.addEventListener('pointerleave', resetBtn);
    }});

    // Load Waline for Reviews Section
    const wContainer = document.getElementById('landing-waline-container') || document.getElementById('landing-giscus-container');
    if (wContainer) {{
      if (window.loadWaline) {{
        window.loadWaline(wContainer, '/');
      }} else if (window.loadGiscus) {{
        window.loadGiscus(wContainer, '/');
      }}
    }}

    // Register PWA Service Worker & Install Handler
    if ('serviceWorker' in navigator) {{
      window.addEventListener('load', () => {{
        navigator.serviceWorker.register('/sw.js').catch(err => console.debug('SW reg failed', err));
      }});
    }}

    let deferredPrompt;
    const installBtn = document.getElementById('btn-pwa-install');
    const dockInstallItem = document.getElementById('dock-install-item');
    const btnDockInstall = document.getElementById('btn-dock-install');
    const landingNav = document.getElementById('landing-nav');

    window.addEventListener('beforeinstallprompt', (e) => {{
      e.preventDefault();
      deferredPrompt = e;
      if (installBtn) installBtn.style.display = 'inline-flex';
      if (dockInstallItem) dockInstallItem.style.display = 'flex';
      if (landingNav) landingNav.style.display = 'flex';
    }});

    const triggerInstall = async () => {{
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice && choice.outcome === 'accepted') {{
        if (installBtn) installBtn.style.display = 'none';
        if (dockInstallItem) dockInstallItem.style.display = 'none';
        if (landingNav) landingNav.style.display = 'none';
      }}
      deferredPrompt = null;
    }};

    if (installBtn) installBtn.addEventListener('click', triggerInstall);
    if (btnDockInstall) btnDockInstall.addEventListener('click', triggerInstall);
  </script>
</body>
</html>
"""

    with open("website/index.html", "w", encoding="utf-8") as f:
        f.write(index_html)
    print("Generated website/index.html (Clean homepage)")

    # =========================================================================
    # 2. Generate website/chapters.html (Dedicated chapters page)
    # Native collapsible <details> with all chapters populated inside
    # =========================================================================
    chapters_html = f"""<!DOCTYPE html>
<html lang="en" data-theme="slaughter">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#0c0d12">
  <title>Chapters by Volume - Renegade Immortal (仙逆)</title>
  <meta name="description" content="Browse all 2,088 chapters of Renegade Immortal (仙逆) categorized across all 13 canonical volumes.">
  <meta property="og:title" content="Chapters by Volume - Renegade Immortal (仙逆)">
  <meta property="og:description" content="Complete chapters list for Renegade Immortal with chapters categorized in 13 canonical volumes.">
  <meta property="og:image" content="assets/cover.jpg">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="assets/cover.jpg">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Renegade">
  <link rel="manifest" href="manifest.webmanifest">
  <link rel="stylesheet" href="assets/themes.css">
  <link rel="stylesheet" href="assets/landing.css">
  <link rel="icon" type="image/png" href="assets/favicon.png">
  <link rel="apple-touch-icon" href="assets/apple-touch-icon.png">
</head>
<body>

  <!-- Navigation -->
  <header class="landing-nav">
    <div class="nav-links">
      <a href="/" class="nav-link">Home</a>
      <a href="/read/ch_1" class="nav-link">Read</a>
      <a href="/download" class="nav-link">EPUB</a>
      <a href="/account" class="nav-link">Profile</a>
      <button id="theme-quick-toggle" class="nav-link" style="background: none; border: 1px solid var(--border-color); padding: 6px 12px; border-radius: var(--border-radius); cursor: pointer;" aria-label="Toggle Theme">
        ⚔️ Theme
      </button>
    </div>
  </header>

  <!-- Chapters Section -->
  <section class="toc-section" style="margin-top: 24px;">
    <div style="margin-bottom: 24px;">
      <h1 style="font-size: clamp(1.8rem, 4vw, 2.5rem); margin: 0 0 8px 0;">Chapters</h1>
      <p style="color: var(--text-muted); margin: 0; font-size: 1rem;">
        Renegade Immortal (仙逆) · All {stats["total_chapters"]:,} Chapters across 13 Canonical Volumes
      </p>
    </div>

    <!-- Continue reading banner if available -->
    <div id="resume-banner" style="display: none; background: var(--card-bg); border: 1px solid var(--accent-color); border-radius: var(--border-radius); padding: 14px 20px; margin-bottom: 20px; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
      <div>
        <span style="color: var(--accent-color); font-weight: 600;">📖 Continue Where You Left Off:</span>
        <span id="resume-chapter-title" style="color: var(--text-color); margin-left: 8px;"></span>
      </div>
      <a id="resume-chapter-link" href="#" class="btn-primary" style="padding: 8px 18px; min-height: 36px; font-size: 0.9rem;">
        Resume Reading
      </a>
    </div>

    <div class="toc-controls-bar">
      <div class="search-input-wrapper">
        <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input type="text" id="toc-search" class="search-input" placeholder="Search chapter title or number (e.g. 359, Ji Realm, Slaughter)..." aria-label="Search chapters">
      </div>
      <div class="toc-actions">
        <button id="btn-toggle-all" class="btn-toggle-all" onclick="toggleAllBooks()">Expand All</button>
      </div>
    </div>

    <!-- Quick Jump Book Pills -->
    <div class="book-pills-bar">
      {pills_rendered}
    </div>

    <!-- 13 Canonical Volumes (Collapsible Native Details Accordions) -->
    <div id="accordions-container">
      {books_rendered}
    </div>
  </section>

  <!-- Floating Back to Top Button -->
  <button id="btn-back-to-top" class="back-to-top-btn" aria-label="Back to Top" title="Scroll to Top">
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
  </button>

  <!-- Footer -->
  <footer class="landing-footer">
    <p>Renegade Reader · Unofficial fan reader platform for <em>Renegade Immortal (仙逆)</em> by Er Gen.</p>
    <p><a href="/">← Back to Novel Overview</a> · <a href="/download">Download Full EPUB</a></p>
  </footer>

  <script src="assets/anime.min.js"></script>
  <script>
    // Anime.js Staggered Entrance Animation
    if (window.anime && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {{
      anime({{
        targets: [
          'header.landing-nav',
          '.toc-section > div',
          '.toc-controls-bar',
          '.book-pills-bar',
          '#accordions-container .book-accordion'
        ],
        opacity: [0, 1],
        translateY: [18, 0],
        delay: anime.stagger(50, {{ start: 60 }}),
        duration: 600,
        easing: 'easeOutCubic'
      }});
    }}

    // Toggle all book accordions between expanded and collapsed
    let allExpanded = false;
    function toggleAllBooks() {{
      allExpanded = !allExpanded;
      const accordions = document.querySelectorAll('details.book-accordion');
      accordions.forEach(acc => {{
        acc.open = allExpanded;
      }});
      const btn = document.getElementById('btn-toggle-all');
      if (btn) btn.textContent = allExpanded ? 'Collapse All' : 'Expand All';
    }}

    // Smooth Accordion Open Animation
    document.querySelectorAll('.book-accordion').forEach(acc => {{
      acc.addEventListener('toggle', () => {{
        if (acc.open && window.anime && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {{
          const grid = acc.querySelector('.chapter-grid');
          if (grid) {{
            anime({{
              targets: grid,
              opacity: [0, 1],
              translateY: [-8, 0],
              duration: 320,
              easing: 'easeOutQuad'
            }});
          }}
        }}
      }});
    }});

    // Button & Pill Micro-interactions
    document.querySelectorAll('.book-pill, .btn-primary, .btn-toggle-all, .nav-link').forEach(btn => {{
      btn.addEventListener('pointerdown', () => {{
        if (window.anime) anime({{ targets: btn, scale: 0.95, duration: 80, easing: 'easeOutQuad' }});
      }});
      const reset = () => {{
        if (window.anime) anime({{ targets: btn, scale: 1, duration: 160, easing: 'easeOutElastic(1, .5)' }});
      }};
      btn.addEventListener('pointerup', reset);
      btn.addEventListener('pointerleave', reset);
    }});

    // Restore last read chapter banner
    try {{
      const lastRead = JSON.parse(localStorage.getItem('renegade_last_read'));
      if (lastRead && lastRead.chapter) {{
        const banner = document.getElementById('resume-banner');
        const link = document.getElementById('resume-chapter-link');
        const titleSpan = document.getElementById('resume-chapter-title');
        if (banner && link && titleSpan) {{
          link.href = '/read/ch_' + lastRead.chapter;
          titleSpan.textContent = 'Chapter ' + lastRead.chapter + (lastRead.title ? ' – ' + lastRead.title : '');
          banner.style.display = 'flex';
        }}
      }}
    }} catch(e) {{}}

    // Live search filter across 2088 chapters
    const searchInput = document.getElementById('toc-search');
    if (searchInput) {{
      searchInput.addEventListener('input', (e) => {{
        const q = e.target.value.toLowerCase().trim();
        const accordions = document.querySelectorAll('details.book-accordion');

        accordions.forEach(acc => {{
          let hasMatch = false;
          const links = acc.querySelectorAll('.chapter-item-link');
          links.forEach(link => {{
            const text = link.textContent.toLowerCase();
            if (!q || text.includes(q)) {{
              link.style.display = 'block';
              hasMatch = true;
            }} else {{
              link.style.display = 'none';
            }}
          }});

          if (q) {{
            if (hasMatch) {{
              acc.style.display = 'block';
              acc.open = true;
            }} else {{
              acc.style.display = 'none';
            }}
          }} else {{
            acc.style.display = 'block';
            if (acc.getAttribute('data-book-num') === '1') {{
              acc.open = true;
            }} else {{
              acc.open = allExpanded;
            }}
          }}
        }});
      }});
    }}

    // Floating Back to Top Button
    const btt = document.getElementById('btn-back-to-top');
    if (btt) {{
      window.addEventListener('scroll', () => {{
        if (window.scrollY > 400) {{
          btt.classList.add('visible');
        }} else {{
          btt.classList.remove('visible');
        }}
      }}, {{ passive: true }});

      btt.addEventListener('click', () => {{
        window.scrollTo({{ top: 0, behavior: 'smooth' }});
      }});
    }}

    // Quick theme toggle
    const THEMES = ['slaughter', 'bead', 'ancient-god', 'life-death', 'karma', 'true-false', 'yellow-springs', 'suzaku', 'allheaven', 'cloud-sea', 'astral', 'bamboo', 'medicine-pavilion'];
    const themeBtn = document.getElementById('theme-quick-toggle');
    if (themeBtn) {{
      themeBtn.addEventListener('click', () => {{
        const curr = document.documentElement.getAttribute('data-theme') || 'slaughter';
        const nextIdx = (THEMES.indexOf(curr) + 1) % THEMES.length;
        const nextTheme = THEMES[nextIdx];
        document.documentElement.setAttribute('data-theme', nextTheme);
        try {{
          const settings = JSON.parse(localStorage.getItem('renegade_reader_settings')) || {{}};
          settings.theme = nextTheme;
          localStorage.setItem('renegade_reader_settings', JSON.stringify(settings));
        }} catch(e) {{}}
      }});
    }}

    // Apply saved theme
    try {{
      const saved = JSON.parse(localStorage.getItem('renegade_reader_settings'));
      if (saved && saved.theme) document.documentElement.setAttribute('data-theme', saved.theme);
    }} catch(e) {{}}

    // Register PWA Service Worker
    if ('serviceWorker' in navigator) {{
      window.addEventListener('load', () => {{
        navigator.serviceWorker.register('/sw.js').catch(err => console.debug('SW reg failed', err));
      }});
    }}
  </script>
</body>
</html>
"""

    os.makedirs("website/chapters", exist_ok=True)
    with open("website/chapters/index.html", "w", encoding="utf-8") as f:
        f.write(chapters_html)
    print("Generated website/chapters/index.html (Clean route /chapters)")

    with open("website/chapters.html", "w", encoding="utf-8") as f:
        f.write(chapters_html)
    print("Generated website/chapters.html (Chapters categorized in 13 volumes)")

    # Generate clean route website/account/index.html
    if os.path.exists("website/account.html"):
        os.makedirs("website/account", exist_ok=True)
        with open("website/account.html", "r", encoding="utf-8") as f:
            account_src_html = f.read()
        with open("website/account/index.html", "w", encoding="utf-8") as f:
            f.write(account_src_html)
        print("Generated website/account/index.html (Clean route /account)")

    # Remove website/read/index.html if it exists to avoid phantom redirect
    if os.path.exists("website/read/index.html"):
        os.remove("website/read/index.html")

    # Remove website/read.html if it exists to avoid directory collisions
    if os.path.exists("website/read.html"):
        os.remove("website/read.html")

    # =========================================================================
    # 3. Generate website/download.html
    # =========================================================================
    download_html = f"""<!DOCTYPE html>
<html lang="en" data-theme="slaughter">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#0c0d12">
  <title>Download EPUB - Renegade Immortal (仙逆)</title>
  <meta name="description" content="Download the complete 2,088-chapter Renegade Immortal EPUB for offline reading on any e-reader or mobile device.">
  <meta property="og:title" content="Download Renegade Immortal (仙逆) EPUB">
  <meta property="og:description" content="Offline full 2,088-chapter EPUB with clean formatting and metadata.">
  <meta property="og:image" content="/assets/cover.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="/assets/cover.jpg">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Renegade">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="stylesheet" href="/assets/themes.css">
  <link rel="stylesheet" href="/assets/landing.css">
  <link rel="icon" type="image/png" href="/assets/favicon.png">
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
  <style>
    .download-container {{
      max-width: 800px;
      margin: 40px auto 80px auto;
      padding: 0 20px;
      text-align: center;
    }}
    .download-card {{
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      padding: 40px 32px;
      box-shadow: 0 12px 36px rgba(0,0,0,0.4);
    }}
    .download-cover {{
      width: 180px;
      height: auto;
      aspect-ratio: 718 / 1024;
      object-fit: cover;
      border-radius: var(--border-radius);
      margin-bottom: 24px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5), 0 0 20px var(--accent-glow);
      border: 1px solid var(--border-color);
    }}
    .download-table {{
      width: 100%;
      margin: 32px 0;
      border-collapse: collapse;
      text-align: left;
    }}
    .download-table td {{
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color);
      font-size: 0.95rem;
    }}
    .download-table td:first-child {{
      color: var(--text-muted);
      width: 35%;
      font-weight: 500;
    }}
    .checksum-code {{
      font-family: monospace;
      font-size: 0.8rem;
      background: var(--bg-secondary);
      padding: 4px 8px;
      border-radius: 4px;
      word-break: break-all;
    }}
    .apps-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      margin-top: 16px;
      text-align: left;
    }}
    .app-item {{
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      padding: 14px;
      font-size: 0.88rem;
    }}
    .app-item strong {{
      display: block;
      color: var(--accent-color);
      margin-bottom: 4px;
    }}
    @media (max-width: 600px) {{
      .download-card {{
        padding: 24px 16px;
      }}
      .download-cover {{
        width: 140px;
      }}
      .download-table td {{
        padding: 10px 8px;
        font-size: 0.85rem;
      }}
      .apps-grid {{
        grid-template-columns: 1fr;
      }}
    }}
  </style>
</head>
<body>
  <header class="landing-nav">
    <div class="nav-links">
      <a href="/" class="nav-link">Home</a>
      <a href="/read/ch_1" class="nav-link">Read Online</a>
      <a href="/chapters" class="nav-link">Chapters</a>
      <a href="/account" class="nav-link">Profile</a>
    </div>
  </header>

  <main class="download-container">
    <div class="download-card">
      <picture>
        <source srcset="/assets/cover.webp" type="image/webp">
        <img src="/assets/cover.jpg" alt="Renegade Immortal Cover" class="download-cover">
      </picture>
      <h1 style="margin: 0 0 8px 0; font-size: clamp(1.6rem, 4vw, 2rem);">Renegade Immortal (仙逆)</h1>
      <p style="color: var(--text-muted); margin-bottom: 24px;">Complete 2,088 Chapters · Full 13 Canonical Books · Offline EPUB</p>

      <a href="/download/Renegade_Immortal.epub" class="btn-primary" style="font-size: 1.05rem; padding: 14px 28px; display: inline-flex; align-items: center; gap: 10px; width: auto;" download>
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
        Download Full EPUB ({file_size_mb})
      </a>

      <table class="download-table">
        <tr>
          <td>Novel Title</td>
          <td>Renegade Immortal (仙逆)</td>
        </tr>
        <tr>
          <td>Author</td>
          <td>Er Gen (耳根)</td>
        </tr>
        <tr>
          <td>Total Chapters</td>
          <td>2,088 Chapters + Extras</td>
        </tr>
        <tr>
          <td>File Format</td>
          <td>EPUB 3.0 (OEBPS / NCX / OPF compliant)</td>
        </tr>
        <tr>
          <td>File Size</td>
          <td>{file_size_mb}</td>
        </tr>
        <tr>
          <td>SHA-256 Checksum</td>
          <td><span class="checksum-code">{sha256_hash}</span></td>
        </tr>
      </table>

      <h3 style="text-align: left; margin: 32px 0 12px 0; color: var(--accent-color);">Recommended E-Readers</h3>
      <div class="apps-grid">
        <div class="app-item">
          <strong>Apple Books</strong>
          Pre-installed on iOS & macOS. Flawless chapter navigation.
        </div>
        <div class="app-item">
          <strong>Moon+ Reader</strong>
          Best for Android devices with custom fonts and themes.
        </div>
        <div class="app-item">
          <strong>Calibre / KOReader</strong>
          Excellent cross-platform desktop & Kindle e-ink support.
        </div>
        <div class="app-item">
          <strong>Lithium</strong>
          Minimalist, fast, ad-free EPUB reader for Android.
        </div>
      </div>
    </div>
  </main>

  <footer class="landing-footer">
    <p>Renegade Reader · Unofficial fan reader platform for <em>Renegade Immortal (仙逆)</em> by Er Gen.</p>
  </footer>

  <script src="/assets/anime.min.js"></script>
  <script>
    try {{
      const saved = JSON.parse(localStorage.getItem('renegade_reader_settings'));
      if (saved && saved.theme) document.documentElement.setAttribute('data-theme', saved.theme);
    }} catch(e) {{}}

    // Anime.js Staggered Entrance Animation
    if (window.anime && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {{
      anime({{
        targets: [
          '.landing-nav',
          '.download-cover',
          '.download-card h1',
          '.download-card p',
          '.download-card .btn-primary',
          '.download-table',
          '.apps-grid .app-item'
        ],
        opacity: [0, 1],
        translateY: [20, 0],
        delay: anime.stagger(60, {{ start: 80 }}),
        duration: 650,
        easing: 'easeOutCubic'
      }});
    }}

    // Button Micro-interactions
    document.querySelectorAll('.btn-primary, .nav-link').forEach(btn => {{
      btn.addEventListener('pointerdown', () => {{
        if (window.anime) anime({{ targets: btn, scale: 0.95, duration: 80, easing: 'easeOutQuad' }});
      }});
      const reset = () => {{
        if (window.anime) anime({{ targets: btn, scale: 1, duration: 160, easing: 'easeOutElastic(1, .5)' }});
      }};
      btn.addEventListener('pointerup', reset);
      btn.addEventListener('pointerleave', reset);
    }});

    // Register PWA Service Worker
    if ('serviceWorker' in navigator) {{
      window.addEventListener('load', () => {{
        navigator.serviceWorker.register('/sw.js').catch(err => console.debug('SW reg failed', err));
      }});
    }}
  </script>
</body>
</html>
"""

    with open("website/download.html", "w", encoding="utf-8") as f:
        f.write(download_html)
    print("Generated website/download.html")

    # Generate clean route website/download/index.html
    os.makedirs("website/download", exist_ok=True)
    with open("website/download/index.html", "w", encoding="utf-8") as f:
        f.write(download_html)
    print("Generated website/download/index.html (Clean route /download)")

    # Cloudflare Pages _redirects file for legacy .html paths
    redirects_content = """# Cloudflare Pages 301 Redirects for Clean URLs
/index.html       /            301
/chapters.html    /chapters    301
/download.html    /download    301
/account.html     /account     301
"""
    with open("website/_redirects", "w", encoding="utf-8") as f:
        f.write(redirects_content)
    print("Generated website/_redirects (Cloudflare Pages Clean URL redirects)")

if __name__ == "__main__":
    main()
