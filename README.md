# Renegade Reader (仙逆)

A high-performance, ad-free, zero-tracker static publishing platform and web novel reader for ***Renegade Immortal* (仙逆)** by Er Gen.

---

## Architecture Overview

```text
Renegade Reader/
├── chapters/            # Cleaned, normalized chapter text files (<title>, <!>, <@>, <#>, <&>, +)
├── scripts/
│   ├── build_chapters.py # Normalizes EPUB xhtml -> chapters/*.txt + metadata
│   ├── html_builder.py   # Compiles chapters/*.txt -> website/read/ch_*.html
│   └── build_landing.py  # Generates website/index.html & website/download.html
├── website/
│   ├── index.html        # Landing page with 13 Canonical Books TOC & live chapter search
│   ├── download.html     # Dedicated offline EPUB download page with SHA-256 checksum
│   ├── meta/             # Novel statistics and 13-book chapter registry
│   ├── assets/           # Reader engine, 13 Xianxia themes, and landing styles
│   └── read/             # 2,088+ pre-compiled static HTML reader pages
└── graphify-out/         # Graphify knowledge graph & interactive architecture visualization
```

---

## 13 Official Cultivation Themes

1. **Slaughter Domain / Ji Realm** (Default Dark)
2. **Heaven Defying Bead** (Spiritual Mist & Emerald Qi)
3. **Royal Ancient God** (Tu Si Star Void Gold)
4. **Life & Death Domain** (Yin-Yang Balance)
5. **Karma Domain** (Karma Crimson Threads)
6. **True & False Domain** (Illusory Sapphire)
7. **Underworld Yellow Springs** (Spectral Nether Moss)
8. **Suzaku Star** (Phoenix Flame)
9. **Allheaven Star System** (Celestial Starlight Azure)
10. **Cloud Sea Realm** (Cosmic Fog)
11. **Immortal Astral Continent** (Grand Empyrean Sun Gold)
12. **Bamboo Slip / Mortal Village** (Light Mulberry Parchment)
13. **Li Muwan's Medicine Pavilion** (Soft Herbal Ivory Cream)

---

## Development & Build Commands

```bash
# 1. Build all chapters, HTML reader pages, and landing index
npm run build
# Or directly via Python:
python3 scripts/build_chapters.py
python3 scripts/html_builder.py
python3 scripts/build_landing.py

# 2. Local Preview Server
python3 -m http.server 8080 --directory website
# Or via Cloudflare Wrangler:
npm run dev

# 3. Deploy to Cloudflare Pages
npm run deploy
```
