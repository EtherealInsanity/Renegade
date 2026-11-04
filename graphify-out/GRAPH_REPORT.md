# Graph Report - Renegade Reader  (2026-11-05)

## Corpus Check
- 16 files · ~10,281,587 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: .css 6, (none) 1, .epub 1)

## Summary
- 150 nodes · 273 edges · 12 communities (8 shown, 4 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 31 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `aaa72f9e`
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
- waline-config.js
- Ponytail, lazy senior dev mode

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

## Import Cycles
- None detected.

## Communities (12 total, 4 thin omitted)

### Community 0 - "json"
Cohesion: 0.25
Nodes (5): clean_text(), get_book_info(), main(), main(), main()

### Community 1 - "reader.js"
Cohesion: 0.10
Nodes (25): applySelectionHighlight(), attachHighlightClick(), closeAllDrawers(), closeChaptersDrawer(), closeNoteModal(), createFloatingToolbar(), focusActiveChapter(), getStoredHighlights() (+17 more)

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
Cohesion: 0.19
Nodes (16): deleteHighlightItem(), escapeHtml(), getDaoProgression(), loadHighlightsData(), loadWalineComments(), persistHighlightChange(), populateChapterDropdown(), renderDaoRoadmap() (+8 more)

### Community 11 - "Ponytail, lazy senior dev mode"
Cohesion: 0.50
Nodes (3): Before you write, Ponytail, lazy senior dev mode, The smallest complete change

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `L()` connect `L` to `anime.min.js`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `r()` (e.g. with `P()` and `b()`) actually correct?**
  _`r()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Should `reader.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1021021021021021 - nodes in this community are weakly interconnected._
- **Why does `r()` connect `anime.min.js` to `L`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `k()` (e.g. with `t()` and `b()`) actually correct?**
  _`k()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Why does `C()` connect `L` to `anime.min.js`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._