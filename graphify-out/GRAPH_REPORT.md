# Graph Report - Renegade Reader  (2026-11-05)

## Corpus Check
- 16 files · ~10,280,676 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: .css 6, (none) 1, .epub 1)

## Summary
- 146 nodes · 267 edges · 16 communities (12 shown, 4 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cae9150c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- json
- reader.js
- anime.min.js
- scripts
- Renegade Reader (仙逆)
- L
- sw.js
- account.js
- applySelectionHighlight
- Ponytail, lazy senior dev mode
- createFloatingToolbar
- initTouchNavigation
- loadChaptersIntoDrawer

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
  website/assets/anime.min.js → website/assets/anime.min.js  _Bridges community 2 → community 6_
- `restoreHighlightsForChapter()` --calls--> `getStoredHighlights()`  [EXTRACTED]
  website/assets/reader.js → website/assets/reader.js  _Bridges community 10 → community 12_
- `initKeyboardNav()` --calls--> `toggleChaptersDrawer()`  [EXTRACTED]
  website/assets/reader.js → website/assets/reader.js  _Bridges community 1 → community 13_
- `openChaptersDrawer()` --calls--> `loadChaptersIntoDrawer()`  [EXTRACTED]
  website/assets/reader.js → website/assets/reader.js  _Bridges community 13 → community 15_

## Import Cycles
- None detected.

## Communities (16 total, 4 thin omitted)

### Community 0 - "json"
Cohesion: 0.25
Nodes (5): clean_text(), get_book_info(), main(), main(), main()

### Community 1 - "reader.js"
Cohesion: 0.17
Nodes (3): closeAllDrawers(), initComments(), initKeyboardNav()

### Community 2 - "anime.min.js"
Cohesion: 0.16
Nodes (30): a(), B(), cn(), d(), E(), en(), f(), g() (+22 more)

### Community 3 - "scripts"
Cohesion: 0.17
Nodes (11): description, name, private, scripts, build, build:chapters, build:landing, build:pages (+3 more)

### Community 5 - "Renegade Reader (仙逆)"
Cohesion: 0.40
Nodes (4): 13 Official Cultivation Themes, Architecture Overview, Development & Build Commands, Renegade Reader (仙逆)

### Community 6 - "L"
Cohesion: 0.29
Nodes (10): C(), L(), b(), g(), h(), m(), o(), u() (+2 more)

### Community 8 - "account.js"
Cohesion: 0.20
Nodes (14): deleteHighlightItem(), escapeHtml(), getDaoProgression(), loadHighlightsData(), persistHighlightChange(), populateChapterDropdown(), renderDaoRoadmap(), renderHighlightsList() (+6 more)

### Community 10 - "applySelectionHighlight"
Cohesion: 0.31
Nodes (8): applySelectionHighlight(), attachHighlightClick(), closeNoteModal(), getStoredHighlights(), openNoteModal(), saveStoredHighlights(), syncHighlightsToCloud(), wrapRangeCrossNode()

### Community 11 - "Ponytail, lazy senior dev mode"
Cohesion: 0.50
Nodes (3): Before you write, Ponytail, lazy senior dev mode, The smallest complete change

### Community 12 - "createFloatingToolbar"
Cohesion: 0.43
Nodes (7): createFloatingToolbar(), handleDeepLinkAnchor(), hideFloatingToolbar(), initHighlights(), handleSelectionCheck(), restoreHighlightsForChapter(), showFloatingToolbar()

### Community 13 - "initTouchNavigation"
Cohesion: 0.50
Nodes (4): closeChaptersDrawer(), initTouchNavigation(), openChaptersDrawer(), toggleChaptersDrawer()

### Community 15 - "loadChaptersIntoDrawer"
Cohesion: 1.00
Nodes (3): focusActiveChapter(), loadChaptersIntoDrawer(), switchTab()

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `L()` connect `L` to `anime.min.js`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `r()` (e.g. with `P()` and `b()`) actually correct?**
  _`r()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Why does `r()` connect `anime.min.js` to `L`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `k()` (e.g. with `t()` and `b()`) actually correct?**
  _`k()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Why does `C()` connect `L` to `anime.min.js`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._