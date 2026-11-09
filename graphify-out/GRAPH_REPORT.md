# Graph Report - Renegade Reader  (2026-11-09)

## Corpus Check
- 16 files · ~10,756,808 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: .css 6, (none) 2, .epub 1)

## Summary
- 156 nodes · 291 edges · 16 communities (10 shown, 6 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `91b8f0a5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- anime.min.js
- account.js
- build_chapters.py
- scripts
- L
- reader.js
- applySelectionHighlight
- initTouchNavigation
- waline-config.js
- createFloatingToolbar
- initFullscreen
- README.md
- sw.js

## God Nodes (most connected - your core abstractions)
1. `L()` - 15 edges
2. `r()` - 12 edges
3. `k()` - 10 edges
4. `u()` - 9 edges
5. `renderHighlightsList()` - 8 edges
6. `C()` - 8 edges
7. `scripts` - 7 edges
8. `main()` - 7 edges
9. `P()` - 7 edges
10. `y()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `r()` --indirect_call--> `b()`  [INFERRED]
  website/assets/anime.min.js → website/assets/anime.min.js  _Bridges community 0 → community 4_
- `restoreHighlightsForChapter()` --calls--> `getStoredHighlights()`  [EXTRACTED]
  website/assets/reader.js → website/assets/reader.js  _Bridges community 6 → community 9_
- `initKeyboardNav()` --calls--> `toggleChaptersDrawer()`  [EXTRACTED]
  website/assets/reader.js → website/assets/reader.js  _Bridges community 5 → community 7_

## Import Cycles
- None detected.

## Communities (16 total, 6 thin omitted)

### Community 0 - "anime.min.js"
Cohesion: 0.15
Nodes (31): a(), B(), C(), cn(), d(), E(), en(), f() (+23 more)

### Community 1 - "account.js"
Cohesion: 0.16
Nodes (20): deleteHighlightItem(), escapeHtml(), getDaoProgression(), getHighlights(), getLastRead(), loadHighlightsData(), loadWalineComments(), persistHighlightChange() (+12 more)

### Community 2 - "build_chapters.py"
Cohesion: 0.25
Nodes (5): clean_text(), get_book_info(), main(), main(), main()

### Community 3 - "scripts"
Cohesion: 0.17
Nodes (11): description, name, private, scripts, build, build:chapters, build:landing, build:pages (+3 more)

### Community 4 - "L"
Cohesion: 0.36
Nodes (9): L(), b(), g(), h(), m(), o(), u(), v() (+1 more)

### Community 5 - "reader.js"
Cohesion: 0.17
Nodes (3): closeAllDrawers(), initComments(), initKeyboardNav()

### Community 6 - "applySelectionHighlight"
Cohesion: 0.31
Nodes (8): applySelectionHighlight(), attachHighlightClick(), closeNoteModal(), getStoredHighlights(), openNoteModal(), saveStoredHighlights(), syncHighlightsToCloud(), wrapRangeCrossNode()

### Community 7 - "initTouchNavigation"
Cohesion: 0.32
Nodes (7): closeChaptersDrawer(), focusActiveChapter(), initTouchNavigation(), loadChaptersIntoDrawer(), switchTab(), openChaptersDrawer(), toggleChaptersDrawer()

### Community 9 - "createFloatingToolbar"
Cohesion: 0.43
Nodes (7): createFloatingToolbar(), handleDeepLinkAnchor(), hideFloatingToolbar(), initHighlights(), handleSelectionCheck(), restoreHighlightsForChapter(), showFloatingToolbar()

### Community 10 - "initFullscreen"
Cohesion: 0.60
Nodes (5): closeSettingsDrawer(), initFullscreen(), isFs(), toggleFs(), updateFsUI()

## Knowledge Gaps
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `L()` connect `L` to `anime.min.js`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `r()` (e.g. with `P()` and `b()`) actually correct?**
  _`r()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Should `anime.min.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14616755793226383 - nodes in this community are weakly interconnected._
- **Why does `initFullscreen()` connect `initFullscreen` to `reader.js`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `k()` (e.g. with `t()` and `b()`) actually correct?**
  _`k()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Why does `r()` connect `anime.min.js` to `L`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._