# Graph Report - Renegade Reader  (2026-11-01)

## Corpus Check
- 11 files · ~56,652,414 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: .css 4, (none) 1, .epub 1)

## Summary
- 51 nodes · 60 edges · 9 communities (3 shown, 6 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `71067307`
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

## God Nodes (most connected - your core abstractions)
1. `scripts` - 7 edges
2. `main()` - 7 edges
3. `main()` - 4 edges
4. `Renegade Reader (仙逆)` - 4 edges
5. `clean_text()` - 3 edges
6. `main()` - 3 edges
7. `get_book_info()` - 2 edges
8. `initGiscusComments()` - 2 edges
9. `initTouchNavigation()` - 2 edges
10. `private` - 1 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `json`  [EXTRACTED]
  scripts/build_chapters.py →   _Bridges community 2 → community 0_

## Import Cycles
- None detected.

## Communities (9 total, 6 thin omitted)

### Community 2 - "build_chapters.py"
Cohesion: 0.52
Nodes (3): clean_text(), get_book_info(), main()

### Community 3 - "scripts"
Cohesion: 0.17
Nodes (11): description, name, private, scripts, build, build:chapters, build:landing, build:pages (+3 more)

### Community 5 - "Renegade Reader (仙逆)"
Cohesion: 0.40
Nodes (4): 13 Official Cultivation Themes, Architecture Overview, Development & Build Commands, Renegade Reader (仙逆)

## Knowledge Gaps
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `main()` connect `build_chapters.py` to `json`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `initGiscusComments()` connect `initGiscusComments` to `reader.js`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._