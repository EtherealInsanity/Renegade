# Graph Report - Renegade Reader  (2026-11-01)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 37 nodes · 48 edges · 5 communities (3 shown, 2 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 2
- Community 3
- Community 4

## God Nodes (most connected - your core abstractions)
1. `main()` - 7 edges
2. `scripts` - 7 edges
3. `main()` - 3 edges
4. `main()` - 3 edges
5. `clean_text()` - 3 edges
6. `get_book_info()` - 2 edges
7. `Renegade Reader - Landing Page & Download Page Builder Generates…` - 1 edges
8. `Renegade Reader - Static HTML Reader Builder Compiles source chapters from…` - 1 edges
9. `Renegade Reader - Chapter Extraction and Normalization Pipeline Processes raw…` - 1 edges
10. `build` - 1 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `json`  [EXTRACTED]
  scripts/build_chapters.py →   _Bridges community 2 → community 0_

## Import Cycles
- None detected.

## Communities (5 total, 2 thin omitted)

### Community 2 - "Community 2"
Cohesion: 0.52
Nodes (3): clean_text(), get_book_info(), main()

### Community 3 - "Community 3"
Cohesion: 0.29
Nodes (7): scripts, build, build:chapters, build:landing, build:pages, deploy, dev

### Community 4 - "Community 4"
Cohesion: 0.40
Nodes (4): description, name, private, version

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `scripts` connect `Community 3` to `Community 4`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Why does `main()` connect `Community 2` to `Community 0`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._