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
                f'<a href="read/ch_{ch_num}.html" class="chapter-item-link" data-title="{title_text.lower()}">'
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

  <!-- Landing Nav -->
  <header class="landing-nav" id="landing-nav" style="display: none;">
    <div class="nav-links">
      <button id="btn-pwa-install" class="nav-link" style="display: none; background: none; border: 1px solid var(--accent-color); color: var(--accent-color); padding: 6px 12px; border-radius: var(--border-radius); cursor: pointer;" aria-label="Install App">
        📥 Install
      </button>
    </div>
  </header>

  <!-- Focused Hero Section: Cover, Name, Volumes, and Read/Download buttons -->
  <main class="hero-section">
    <div class="hero-cover">
      <div class="hero-cover-tilt-wrap" id="hero-cover-wrap">
        <div class="hero-cover-sheen" id="hero-cover-sheen"></div>
        <picture>
          <source srcset="assets/cover.webp" type="image/webp">
          <img src="assets/cover.jpg" alt="Renegade Immortal (仙逆) Novel Cover Art" width="340" height="452" class="hero-cover-img" loading="eager">
        </picture>
      </div>
    </div>

    <div class="hero-content">
      <h1 class="novel-title">Renegade Immortal<span class="novel-chinese-title">仙逆</span></h1>
      <div class="novel-author">By <strong>Er Gen (耳根)</strong> · Official Translation</div>

      <div class="novel-meta-text" style="color: var(--text-muted); font-size: 1.05rem; margin-top: 14px; margin-bottom: 26px;">
        13 Canonical Volumes · {stats["total_chapters"]:,} Chapters · {stats["total_words"]:,} Words · Complete
      </div>

      <!-- Action Buttons: Read & Download (with automatic Resume for returning readers) -->
      <div class="hero-cta-buttons">
        <a id="btn-hero-primary" href="read/ch_1.html" class="btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <span id="hero-primary-text">Read</span>
        </a>
        <a href="download.html" class="btn-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Download
        </a>
      </div>
    </div>
  </main>

  <!-- Reviews & Community Discussions Section -->
  <section class="reviews-section" id="reviews">
    <!-- Live Community Reviews & Discussions (Giscus) -->
    <div class="landing-assembly-container">
      <div class="landing-assembly-header">
        <div>
          <h3>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Community Reviews & Discussion
          </h3>
          <span class="landing-assembly-sub">Share your thoughts, reviews, and discuss the novel with fellow readers.</span>
        </div>
        <span class="brand-badge">GitHub Discussion</span>
      </div>
      <div id="landing-giscus-container" class="giscus-thread-container" data-term="Renegade Immortal - Novel Reviews & Community Ratings">
        <div class="giscus-skeleton">
          <div class="giscus-spinner"></div>
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

  <script src="assets/anime.min.js"></script>
  <script src="assets/giscus-config.js"></script>
  <script>
    // Restore last read chapter button
    try {{
      const lastRead = JSON.parse(localStorage.getItem('renegade_last_read'));
      if (lastRead && lastRead.chapter) {{
        const primaryBtn = document.getElementById('btn-hero-primary');
        const primaryTxt = document.getElementById('hero-primary-text');
        if (primaryBtn && primaryTxt) {{
          primaryBtn.href = 'read/ch_' + lastRead.chapter + '.html';
          primaryTxt.textContent = 'Resume Ch. ' + lastRead.chapter;
        }}
      }}
    }} catch(e) {{}}

    // Apply saved theme on landing page
    try {{
      const saved = JSON.parse(localStorage.getItem('renegade_reader_settings'));
      if (saved && saved.theme) document.documentElement.setAttribute('data-theme', saved.theme);
    }} catch(e) {{}}

    // 3D Cover Tilt & Glare Hover Animation
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
        coverWrap.style.transform = `perspective(1000px) rotateX(${{rotX.toFixed(2)}}deg) rotateY(${{rotY.toFixed(2)}}deg) scale3d(1.04, 1.04, 1.04)`;
        if (coverSheen) {{
          const px = ((x + 0.5) * 100).toFixed(1);
          const py = ((y + 0.5) * 100).toFixed(1);
          coverSheen.style.background = `radial-gradient(circle at ${{px}}% ${{py}}%, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0) 65%)`;
        }}
      }});
      coverWrap.addEventListener('pointerleave', () => {{
        bounds = null;
        if (window.anime) {{
          anime({{
            targets: coverWrap,
            rotateX: 0,
            rotateY: 0,
            scale: 1,
            duration: 800,
            easing: 'easeOutElastic(1, .5)'
          }});
          anime({{
            targets: coverSheen,
            opacity: 0,
            duration: 350,
            easing: 'easeOutQuad'
          }});
        }} else {{
          coverWrap.style.transform = 'none';
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
          '.novel-meta-text',
          '.hero-cta-buttons .btn-primary',
          '.hero-cta-buttons .btn-secondary',
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

    // Load Giscus for Reviews Section
    if (window.loadGiscus) {{
      const gContainer = document.getElementById('landing-giscus-container');
      if (gContainer) {{
        window.loadGiscus(gContainer, 'Renegade Immortal - Novel Reviews & Community Ratings');
      }}
    }}

    // Register PWA Service Worker & Install Handler
    if ('serviceWorker' in navigator) {{
      window.addEventListener('load', () => {{
        navigator.serviceWorker.register('./sw.js').catch(err => console.debug('SW reg failed', err));
      }});
    }}

    let deferredPrompt;
    const installBtn = document.getElementById('btn-pwa-install');
    const landingNav = document.getElementById('landing-nav');
    window.addEventListener('beforeinstallprompt', (e) => {{
      e.preventDefault();
      deferredPrompt = e;
      if (installBtn) installBtn.style.display = 'inline-flex';
      if (landingNav) landingNav.style.display = 'flex';
    }});

    if (installBtn) {{
      installBtn.addEventListener('click', async () => {{
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {{
          installBtn.style.display = 'none';
          if (landingNav) landingNav.style.display = 'none';
        }}
        deferredPrompt = null;
      }});
    }}
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
      <a href="./" class="nav-link">Home</a>
      <a href="read/ch_1.html" class="nav-link">Read</a>
      <a href="download.html" class="nav-link">EPUB</a>
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
    <p><a href="./">← Back to Novel Overview</a> · <a href="download.html">Download Full EPUB</a></p>
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
          link.href = 'read/ch_' + lastRead.chapter + '.html';
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
        navigator.serviceWorker.register('./sw.js').catch(err => console.debug('SW reg failed', err));
      }});
    }}
  </script>
</body>
</html>
"""

    os.makedirs("website/chapters", exist_ok=True)
    chapters_subfolder_html = chapters_html
    chapters_subfolder_html = chapters_subfolder_html.replace('content="assets/', 'content="../assets/')
    chapters_subfolder_html = chapters_subfolder_html.replace('href="assets/', 'href="../assets/')
    chapters_subfolder_html = chapters_subfolder_html.replace('src="assets/', 'src="../assets/')
    chapters_subfolder_html = chapters_subfolder_html.replace('href="manifest.webmanifest"', 'href="../manifest.webmanifest"')
    chapters_subfolder_html = chapters_subfolder_html.replace('href="./"', 'href="../"')
    chapters_subfolder_html = chapters_subfolder_html.replace('href="read/', 'href="../read/')
    chapters_subfolder_html = chapters_subfolder_html.replace('href="download.html"', 'href="../download.html"')
    chapters_subfolder_html = chapters_subfolder_html.replace("link.href = 'read/ch_'", "link.href = '../read/ch_'")
    chapters_subfolder_html = chapters_subfolder_html.replace("navigator.serviceWorker.register('./sw.js')", "navigator.serviceWorker.register('../sw.js')")

    with open("website/chapters/index.html", "w", encoding="utf-8") as f:
        f.write(chapters_subfolder_html)
    print("Generated website/chapters/index.html (Clean route /chapters)")

    with open("website/chapters.html", "w", encoding="utf-8") as f:
        f.write(chapters_html)
    print("Generated website/chapters.html (Chapters categorized in 13 volumes)")

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
  <meta property="og:image" content="assets/cover.jpg">
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
      aspect-ratio: 600 / 798;
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
      <a href="./" class="nav-link">Home</a>
      <a href="read/ch_1.html" class="nav-link">Read Online</a>
      <a href="chapters.html" class="nav-link">Chapters</a>
    </div>
  </header>

  <main class="download-container">
    <div class="download-card">
      <picture>
        <source srcset="assets/cover.webp" type="image/webp">
        <img src="assets/cover.jpg" alt="Renegade Immortal Cover" class="download-cover">
      </picture>
      <h1 style="margin: 0 0 8px 0; font-size: clamp(1.6rem, 4vw, 2rem);">Renegade Immortal (仙逆)</h1>
      <p style="color: var(--text-muted); margin-bottom: 24px;">Complete 2,088 Chapters · Full 13 Canonical Books · Offline EPUB</p>

      <a href="download/Renegade_Immortal.epub" class="btn-primary" style="font-size: 1.05rem; padding: 14px 28px; display: inline-flex; align-items: center; gap: 10px; width: auto;" download>
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

  <script src="assets/anime.min.js"></script>
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
  </script>
</body>
</html>
"""

    with open("website/download.html", "w", encoding="utf-8") as f:
        f.write(download_html)
    print("Generated website/download.html")

if __name__ == "__main__":
    main()
