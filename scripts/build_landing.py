#!/usr/bin/env python3
"""
Renegade Reader - Landing Page & Download Page Builder (Mobile Optimized)
Generates website/index.html with 13 Canonical Book accordions and website/download.html
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

    # Build Book Accordions HTML
    accordions_html = []
    pills_html = []

    for b in books:
        b_num = b["book"]
        b_title = b["title"]
        b_chapters = chapters_by_book.get(b_num, [])
        ch_count = len(b_chapters)
        start_ch = b["start"]
        end_ch = b["end"]

        pills_html.append(f'<a href="#book-{b_num}" class="book-pill">Book {b_num}</a>')

        # Open the first book by default
        open_class = "open" if b_num == 1 else ""

        ch_items_html = []
        for ch in b_chapters:
            ch_num = ch["chapter"]
            ch_items_html.append(
                f'<a href="read/ch_{ch_num}.html" class="chapter-item-link" data-title="{ch["title"].lower()}">'
                f'Ch. {ch_num} - {ch["title"]}</a>'
            )

        accordion_block = f"""
        <div id="book-{b_num}" class="book-accordion {open_class}" data-book-num="{b_num}">
          <div class="book-header" onclick="toggleBook({b_num})">
            <div class="book-title-group">
              <h3>Book {b_num}: {b_title}</h3>
              <span class="book-subtitle">Chapters {start_ch} – {end_ch} · {ch_count} chapters</span>
            </div>
            <svg class="book-toggle-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </div>
          <div class="chapter-grid" id="grid-book-{b_num}">
            {"".join(ch_items_html)}
          </div>
        </div>
        """
        accordions_html.append(accordion_block)

    books_rendered = "\n".join(accordions_html)
    pills_rendered = "\n".join(pills_html)

    # Generate website/index.html
    index_html = f"""<!DOCTYPE html>
<html lang="en" data-theme="slaughter">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#0c0d12">
  <title>Renegade Immortal (仙逆) - Complete Web Novel Reader</title>
  <meta name="description" content="Read Renegade Immortal (仙逆) by Er Gen online. Fast, clean, ad-free reader across all 13 canonical books and 2,088 chapters with custom Xianxia themes.">
  <meta property="og:title" content="Renegade Immortal (仙逆) - Complete Web Novel Reader">
  <meta property="og:description" content="Read all 2,088 chapters of Renegade Immortal (仙逆) online. Ad-free, 13 custom Xianxia themes, instant offline download.">
  <meta property="og:image" content="assets/cover.jpg">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="assets/cover.jpg">
  <link rel="stylesheet" href="assets/themes.css">
  <link rel="stylesheet" href="assets/landing.css">
  <link rel="icon" type="image/png" href="assets/favicon.png">
  <link rel="apple-touch-icon" href="assets/icon-192.png">
</head>
<body>

  <!-- Landing Nav -->
  <header class="landing-nav">
    <a href="index.html" class="brand-title">
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>
      <span class="logo-text">Renegade Reader</span>
      <span class="brand-badge">仙逆</span>
    </a>

    <div class="nav-links">
      <a href="read/ch_1.html" class="nav-link">Read</a>
      <a href="download.html" class="nav-link">EPUB</a>
      <button id="theme-quick-toggle" class="nav-link" style="background: none; border: 1px solid var(--border-color); padding: 6px 12px; border-radius: var(--border-radius); cursor: pointer;" aria-label="Toggle Theme">
        ⚔️ Theme
      </button>
    </div>
  </header>

  <!-- Hero Banner -->
  <section class="hero-section">
    <div class="hero-cover">
      <picture>
        <source srcset="assets/cover.webp" type="image/webp">
        <img src="assets/cover.jpg" alt="Renegade Immortal (仙逆) Novel Cover Art" width="260" height="346" class="hero-cover-img" loading="eager">
      </picture>
    </div>

    <div class="hero-content">
      <div class="novel-tagline">Classic Xianxia Cultivation Masterpiece</div>
      <h1 class="novel-title">Renegade Immortal<span class="novel-chinese-title">仙逆</span></h1>
      <div class="novel-author">By <strong>Er Gen (耳根)</strong> · Official Translation</div>

      <div class="novel-stats-row">
        <div class="stat-item">
          <div class="stat-val">{stats["total_chapters"]:,}</div>
          <div class="stat-lbl">Chapters</div>
        </div>
        <div class="stat-item">
          <div class="stat-val">{stats["total_books"]}</div>
          <div class="stat-lbl">Canonical Books</div>
        </div>
        <div class="stat-item">
          <div class="stat-val">{stats["total_words"] / 1000000:.2f}M</div>
          <div class="stat-lbl">Words</div>
        </div>
        <div class="stat-item">
          <div class="stat-val">13</div>
          <div class="stat-lbl">Daoist Themes</div>
        </div>
      </div>

      <p class="novel-synopsis">
        Wang Lin is a very smart boy with loving parents, shunned by relatives. One day, he gains the opportunity to walk the path of immortality, only to find he possesses mediocre talent at best. Watch Wang Lin as he shatters fate, masters the Ji Realm, grasps the Heaven Defying Bead, and walks a ruthless slaughter path toward true immortality.
      </p>

      <div class="hero-cta-buttons">
        <a href="read/ch_1.html" class="btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Begin from Chapter 1
        </a>
        <a id="btn-continue-reading" href="read/ch_1.html" class="btn-secondary" style="display: none;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"/><path d="M20 12l-6-6"/><path d="M20 12l-6 6"/></svg>
          <span id="continue-reading-text">Continue Reading</span>
        </a>
        <a href="download.html" class="btn-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Offline EPUB
        </a>
      </div>
    </div>
  </section>

  <!-- Table of Contents Section -->
  <section class="toc-section">
    <div class="toc-controls-bar">
      <h2>Table of Contents</h2>
      <div class="search-input-wrapper">
        <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input type="text" id="toc-search" class="search-input" placeholder="Search chapter title or number (e.g. 359, Ji Realm, Slaughter)..." aria-label="Search chapters">
      </div>
    </div>

    <!-- Quick Jump Book Pills -->
    <div class="book-pills-bar">
      {pills_rendered}
    </div>

    <!-- 13 Book Accordions -->
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
    <p>Ad-free, zero trackers, 100% static client-side architecture. Optimized for desktop & mobile.</p>
  </footer>

  <script>
    // Toggle Book Accordion
    function toggleBook(bookNum) {{
      const acc = document.getElementById('book-' + bookNum);
      if (acc) acc.classList.toggle('open');
    }}

    // Restore last read chapter button
    try {{
      const lastRead = JSON.parse(localStorage.getItem('renegade_last_read'));
      if (lastRead && lastRead.chapter) {{
        const btn = document.getElementById('btn-continue-reading');
        const txt = document.getElementById('continue-reading-text');
        if (btn && txt) {{
          btn.href = 'read/ch_' + lastRead.chapter + '.html';
          txt.textContent = 'Resume Chapter ' + lastRead.chapter;
          btn.style.display = 'inline-flex';
        }}
      }}
    }} catch(e) {{}}

    // Live search filter across 2088 chapters
    const searchInput = document.getElementById('toc-search');
    if (searchInput) {{
      searchInput.addEventListener('input', (e) => {{
        const q = e.target.value.toLowerCase().trim();
        const accordions = document.querySelectorAll('.book-accordion');

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
              acc.classList.add('open');
            }} else {{
              acc.style.display = 'none';
            }}
          }} else {{
            acc.style.display = 'block';
            if (acc.getAttribute('data-book-num') === '1') {{
              acc.classList.add('open');
            }} else {{
              acc.classList.remove('open');
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

    // Apply saved theme on landing page
    try {{
      const saved = JSON.parse(localStorage.getItem('renegade_reader_settings'));
      if (saved && saved.theme) document.documentElement.setAttribute('data-theme', saved.theme);
    }} catch(e) {{}}
  </script>
</body>
</html>
"""

    with open("website/index.html", "w", encoding="utf-8") as f:
        f.write(index_html)
    print("Generated website/index.html")

    # Generate website/download.html
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
  <link rel="stylesheet" href="assets/themes.css">
  <link rel="stylesheet" href="assets/landing.css">
  <link rel="icon" type="image/png" href="assets/favicon.png">
  <link rel="apple-touch-icon" href="assets/icon-192.png">
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
    <a href="index.html" class="brand-title">
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>
      <span>Renegade Reader</span>
      <span class="brand-badge">仙逆</span>
    </a>
    <div class="nav-links">
      <a href="index.html" class="nav-link">Home</a>
      <a href="read/ch_1.html" class="nav-link">Read Online</a>
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

  <script>
    try {{
      const saved = JSON.parse(localStorage.getItem('renegade_reader_settings'));
      if (saved && saved.theme) document.documentElement.setAttribute('data-theme', saved.theme);
    }} catch(e) {{}}
  </script>
</body>
</html>
"""

    with open("website/download.html", "w", encoding="utf-8") as f:
        f.write(download_html)
    print("Generated website/download.html")

if __name__ == "__main__":
    main()
