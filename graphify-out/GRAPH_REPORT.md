# Graph Report - Renegade Reader  (2026-11-04)

## Corpus Check
- 13 files · ~10,424,630 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: .css 4, (none) 1, .epub 1)

## Summary
- 106 nodes · 193 edges · 13 communities (10 shown, 3 thin omitted)
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9718c811`
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
- k
- r
- a
- Ponytail, lazy senior dev mode
- tn

## God Nodes (most connected - your core abstractions)
1. `L()` - 15 edges
2. `r()` - 12 edges
3. `k()` - 10 edges
4. `u()` - 9 edges
5. `C()` - 8 edges
6. `scripts` - 7 edges
7. `main()` - 7 edges
8. `P()` - 7 edges
9. `y()` - 7 edges
10. `a()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `P()` --indirect_call--> `r()`  [INFERRED]
  website/assets/anime.min.js → website/assets/anime.min.js  _Bridges community 9 → community 2_
- `r()` --indirect_call--> `b()`  [INFERRED]
  website/assets/anime.min.js → website/assets/anime.min.js  _Bridges community 9 → community 6_
- `r()` --indirect_call--> `m()`  [INFERRED]
  website/assets/anime.min.js → website/assets/anime.min.js  _Bridges community 9 → community 8_
- `k()` --indirect_call--> `t()`  [INFERRED]
  website/assets/anime.min.js → website/assets/anime.min.js  _Bridges community 8 → community 12_
- `b()` --indirect_call--> `k()`  [INFERRED]
  website/assets/anime.min.js → website/assets/anime.min.js  _Bridges community 8 → community 6_

## Import Cycles
- None detected.

## Communities (13 total, 3 thin omitted)

### Community 0 - "json"
Cohesion: 0.25
Nodes (5): clean_text(), get_book_info(), main(), main(), main()

### Community 1 - "reader.js"
Cohesion: 0.14
Nodes (10): closeAllDrawers(), closeChaptersDrawer(), focusActiveChapter(), initGiscusComments(), initKeyboardNav(), initTouchNavigation(), loadChaptersIntoDrawer(), switchTab() (+2 more)

### Community 2 - "anime.min.js"
Cohesion: 0.30
Nodes (10): cn(), d(), g(), h(), J(), o(), P(), q() (+2 more)

### Community 3 - "scripts"
Cohesion: 0.17
Nodes (11): description, name, private, scripts, build, build:chapters, build:landing, build:pages (+3 more)

### Community 5 - "Renegade Reader (仙逆)"
Cohesion: 0.40
Nodes (4): 13 Official Cultivation Themes, Architecture Overview, Development & Build Commands, Renegade Reader (仙逆)

### Community 6 - "L"
Cohesion: 0.29
Nodes (10): C(), L(), b(), g(), h(), m(), o(), u() (+2 more)

### Community 8 - "k"
Cohesion: 0.48
Nodes (7): B(), E(), k(), m(), n(), nn(), T()

### Community 9 - "r"
Cohesion: 0.43
Nodes (7): r(), u(), V(), c(), W(), x(), y()

### Community 10 - "a"
Cohesion: 0.67
Nodes (4): a(), en(), f(), I()

### Community 11 - "Ponytail, lazy senior dev mode"
Cohesion: 0.50
Nodes (3): Before you write, Ponytail, lazy senior dev mode, The smallest complete change

## Knowledge Gaps
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `L()` connect `L` to `anime.min.js`, `k`, `r`, `a`, `tn`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `r()` (e.g. with `P()` and `b()`) actually correct?**
  _`r()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Should `reader.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1380952380952381 - nodes in this community are weakly interconnected._
- **Why does `r()` connect `r` to `k`, `anime.min.js`, `a`, `L`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `k()` (e.g. with `t()` and `b()`) actually correct?**
  _`k()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Why does `C()` connect `L` to `anime.min.js`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._