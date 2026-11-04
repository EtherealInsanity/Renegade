# Graph Report - Renegade Reader  (2026-11-04)

## Corpus Check
- 12 files · ~11,305,222 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: .css 4, (none) 1, .epub 1)

## Summary
- 62 nodes · 79 edges · 12 communities (6 shown, 6 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ee318cb9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- json
- build_chapters.py
- scripts
- Renegade Reader (仙逆)
- initTouchNavigation
- sw.js
- initGiscusComments
- initKeyboardNav
- loadChaptersIntoDrawer
- Ponytail, lazy senior dev mode

## God Nodes (most connected - your core abstractions)
1. `scripts` - 7 edges
2. `main()` - 7 edges
3. `main()` - 4 edges
4. `initTouchNavigation()` - 4 edges
5. `openChaptersDrawer()` - 4 edges
6. `toggleChaptersDrawer()` - 4 edges
7. `loadChaptersIntoDrawer()` - 4 edges
8. `Renegade Reader (仙逆)` - 4 edges
9. `clean_text()` - 3 edges
10. `main()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `json`  [EXTRACTED]
  scripts/build_chapters.py →   _Bridges community 2 → community 0_
- `initKeyboardNav()` --calls--> `toggleChaptersDrawer()`  [EXTRACTED]
  website/assets/reader.js → website/assets/reader.js  _Bridges community 9 → community 6_
- `openChaptersDrawer()` --calls--> `loadChaptersIntoDrawer()`  [EXTRACTED]
  website/assets/reader.js → website/assets/reader.js  _Bridges community 6 → community 10_

## Import Cycles
- None detected.

## Communities (12 total, 6 thin omitted)

### Community 2 - "build_chapters.py"
Cohesion: 0.52
Nodes (3): clean_text(), get_book_info(), main()

### Community 3 - "scripts"
Cohesion: 0.17
Nodes (11): description, name, private, scripts, build, build:chapters, build:landing, build:pages (+3 more)

### Community 5 - "Renegade Reader (仙逆)"
Cohesion: 0.40
Nodes (4): 13 Official Cultivation Themes, Architecture Overview, Development & Build Commands, Renegade Reader (仙逆)

### Community 6 - "initTouchNavigation"
Cohesion: 0.50
Nodes (4): closeChaptersDrawer(), initTouchNavigation(), openChaptersDrawer(), toggleChaptersDrawer()

### Community 10 - "loadChaptersIntoDrawer"
Cohesion: 1.00
Nodes (3): focusActiveChapter(), loadChaptersIntoDrawer(), switchTab()

### Community 11 - "Ponytail, lazy senior dev mode"
Cohesion: 0.50
Nodes (3): Before you write, Ponytail, lazy senior dev mode, The smallest complete change

## Knowledge Gaps
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `initTouchNavigation()` connect `initTouchNavigation` to `reader.js`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `initGiscusComments()` connect `initGiscusComments` to `reader.js`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._