---
title: Web UI
description: NestWeaver's search-first graph workspace — task lenses, Search Phrases, the repo-galaxy constellation, and graph/table/JSON views over your code and notes.
sidebar:
  order: 1
---

NestWeaver ships an interactive web workspace that turns the code+notes graph into something you explore by task, not by graph theory. It runs on Three.js / React-Three-Fiber and opens on a **repo-galaxy constellation** — one luminous cluster per repository — rendered dark-first.

```bash
nestweaver ui --db ./nestweaver.lbug --port 8080
nestweaver ui --db ./nestweaver.lbug --port 8080 --watch  # live re-indexing
```

Open `http://localhost:8080` after it starts. The CLI defaults to port 3000; the macOS `.app` serves it on 9377 and opens it automatically.

## Work by task, not by graph theory

Everything in the UI is organized around what you're trying to do:

- **Workspace scope** — switch between all indexed content, a single repo, or a vault. Every view carries an honest trust chip: local-only vs federated, current vs stale, partial vs truncated. You always know what the answer is (and isn't) based on.
- **Command bar (`⌘K`) and Search Phrases** — plain-language queries resolve to typed scenes deterministically. No LLM in the loop; the same phrase always produces the same scene:
  - `impact of <symbol>` — blast radius
  - `trace flow from <symbol>` — forward call chain
  - `callers of <symbol>` / `callees of <symbol>`
  - `path from <A> to <B>` — shortest path between two symbols
  - `tests affected by <symbol>` — test selection
  - `notes about <topic>` / `backlinks for <note>`
  - `hubs in <repo>` / `bridges in <repo>` / `dead code in <repo>`
  - `explain <symbol>`, `contract drift`, `stale repos`
- **Task modes** — six top-level modes, switchable with the keys `1`–`6`: Overview, Context, Impact, Repos, Features, and Local neighborhood. Impact mode renders a layered blast-radius DAG with affected tests and local/org trust states. Search Phrases and node actions activate additional lenses on top (Trace, Path, and more).

## The tri-panel workspace

Activating a node opens three synced panels:

1. **Graph** — a focused subgraph around the selection.
2. **Evidence** — the source span or note excerpt backing the node, with syntax highlighting. When there is no evidence, the UI says so explicitly rather than guessing.
3. **Knowledge card** — identity, role, evidence, relationships, trust, and next actions (open source, trace, find path, impact, ask).

The three panels cross-highlight, so selecting in one focuses the others.

## Graph, table, matrix, or JSON

Every result set is inspectable multiple ways. `⌘L` cycles the three canvas representations — **graph**, **table**, and **matrix** — and a JSON view is a separate toggle:

- **Graph** — the spatial constellation view.
- **Table** — an accessible, sortable list of the same nodes.
- **Matrix** — an adjacency matrix of the scene's relationships.
- **JSON** — the raw payload, including the `_meta` provenance and trust envelope.

This means every graph answer has a non-visual equivalent, which matters for accessibility and for copying results into other tools.

## Reading the constellation

The visuals encode meaning, not decoration:

- **Color** = node kind (function, class, method, interface, note, …).
- **Size / glow** = importance (PageRank in the current scene).
- **Spark-green convergence rings** mark betweenness bridges — the architectural chokepoints that connect otherwise separate parts of the graph.

Motion is used sparingly to aid comprehension — a repo-galaxy ignition on load and a focus impact-ripple that traces blast radius — and **all motion, bloom, and glow are gated behind `prefers-reduced-motion`**, which the UI auto-detects. There is also a manual reduced-effects toggle.

## Keyboard shortcuts

Press `?` in the UI for the full list. The essentials:

| Key             | Action                                                               |
| --------------- | -------------------------------------------------------------------- |
| `1`–`6`         | Switch task mode (Overview, Context, Impact, Repos, Features, Local) |
| `⌘K`            | Open the ask / Search-Phrase command bar                             |
| `/`             | Focus search                                                         |
| `⌘L`            | Cycle graph / table / matrix representation                          |
| `⌘⇧G`           | Toggle zen (canvas-only) layout                                      |
| `I`             | Impact of the selected node                                          |
| `P`             | Path from the selected node                                          |
| `M` / `C` / `T` | Toggle minimap / communities / tags                                  |
| `⌘Z` / `⌘⇧Z`    | Navigate history back / forward                                      |
| `Esc`           | Clear selection                                                      |

## Deep links

The URL captures the workspace scope, selected node, active lens, and representation mode, so any view is shareable and restores exactly.

## WASM mode

Append `?engine=wasm` to the URL to run graph algorithms client-side via WebAssembly. The browser downloads a MessagePack snapshot and executes Personalized PageRank locally, with no server round-trips for queries. See [the build note in the main repository](https://github.com/Kehl-io/nestweaver) for producing the WASM artifact.

:::tip[Accessibility]
All six task journeys have a keyboard-only path, reduced-motion preserves every static meaning channel, and graph answers always have a table/JSON equivalent. A screen-reader landmark summary mirrors the canvas so the scene's structure is available without vision.
:::
