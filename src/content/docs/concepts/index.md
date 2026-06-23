---
title: How the Graph Works
description: How NestWeaver builds a queryable knowledge graph from your codebase using Tree-sitter parsing and cross-file symbol resolution.
sidebar:
  order: 1
---

NestWeaver parses your source code into a persistent knowledge graph where nodes are symbols (functions, classes, types, fields) and edges are structural relationships (calls, imports, type usage, field access). This graph persists across sessions, updates incrementally, and lets AI agents query your codebase without reading raw source files.

This page explains how that graph gets built, what it contains, and how it stays current.

## Parsing

NestWeaver uses [Tree-sitter](https://tree-sitter.github.io/) to parse source code into ASTs across 32 languages — JavaScript, TypeScript, Go, Python, Rust, Java, C/C++, Lua, Scala, Elixir, Zig, Vue, Svelte, and more. Markdown files (including Obsidian vaults) are parsed via [comrak](https://github.com/kivikakk/comrak).

From each AST, the parser extracts:

- **Symbols** — functions, classes, interfaces, types, structs, enums, fields, methods
- **Scopes** — lexical scope boundaries for local variable resolution
- **Raw references** — call expressions, import paths, type annotations, field accesses
- **Type bindings** — AST-extracted type annotations, constructors, `self`/`this` references, and return types used for downstream call resolution

The parser also detects entry points (e.g. `main()`, test files, framework-specific patterns) and framework conventions (React, Next.js, Express, etc.) to enrich the graph with structural metadata.

```bash
# Index a repository — auto-detects language from file extensions
nestweaver index
```

## Resolution

After parsing, the resolver connects symbols across files by tracing every raw reference to its definition. This is where the graph's edges come from.

Resolution handles:

- **Import resolution** — follows `import`, `require`, `use`, `from` across files, resolving relative paths, package names, and re-exports
- **Type references** — connects type annotations, generic parameters, and return types to their definitions
- **Function calls** — resolves `obj.method()` to the correct target class using AST-extracted type bindings (annotations, constructors, `self`/`this`, return types)
- **Field accesses** — traces property reads and writes to their owning type
- **Inheritance** — follows `extends` and `implements` through the class hierarchy (MRO walk, depth 5, cycle-safe)

Each resolved edge receives a **confidence score** between 0.0 and 1.0. A direct import gets high confidence; a method call resolved through inferred type bindings gets lower confidence. These scores drive downstream features like impact analysis, where low-confidence paths are pruned.

Resolution also understands monorepo workspaces and tsconfig path aliases, and supports 12 manifest formats (`package.json`, `Cargo.toml`, `go.mod`, `pyproject.toml`, etc.) for cross-package resolution.

## Edge types and weights

Every edge in the graph has a type and a base weight that reflects coupling strength:

| Edge type                | Base weight | Description                                          |
| ------------------------ | ----------- | ---------------------------------------------------- |
| `CALLS`                  | 1.0         | Function/method invocation — strongest coupling      |
| `EXTENDS` / `IMPLEMENTS` | 0.9         | Class inheritance and interface implementation       |
| `IMPORTS`                | 0.7         | Module import — dependency without call detail       |
| `USES`                   | 0.5         | Type reference — real but weaker coupling            |
| `ACCESSES`               | 0.4         | Field/property access — medium coupling              |
| `MEMBER_OF` / `INCLUDES` | 0.2         | Structural containment (class member, module member) |

These weights feed directly into the [Personalized PageRank](/concepts/pagerank/) algorithm. When you query for context around a symbol, edges with higher weights propagate more relevance. An intent system layers multipliers on top of base weights to tune retrieval for different query types.

## Storage

The graph is stored in **LadybugDB**, a single-writer, multiple-reader embedded database that uses a single `.lbug` file. LadybugDB provides:

- **SWMR architecture** — one process (the daemon) holds the write lock; any number of readers can query concurrently without blocking
- **Transactional writes** — indexing operations are atomic; a crash mid-index won't corrupt the graph

Alongside the main `.lbug` database, NestWeaver maintains several **sidecar files**:

| Sidecar              | Purpose                                           |
| -------------------- | ------------------------------------------------- |
| `.pagerank.json`     | Cached global PageRank scores                     |
| `.manifests.json`    | Parsed package manifests for workspace resolution |
| `.git-activity.json` | File-level churn scores from git history          |
| `.cochanges.json`    | Jaccard-scored co-change pairs from git history   |
| `.tantivy/`          | BM25 full-text search index (Tantivy)             |
| `.embeddings/`       | Vector embeddings for semantic search             |
| `.interactions.json` | Agent interaction memory (opt-in)                 |

Sidecar files are named relative to the database path (e.g., `brain.lbug.pagerank.json`) and are automatically loaded by the daemon on startup.

## Incremental updates

NestWeaver uses **BLAKE3 content hashing** to detect which files have actually changed between index runs. On each run, it compares the hash of every file against the previously stored hash. Only files with new content are re-parsed and re-resolved — unchanged files carry forward their existing graph nodes and edges.

This makes re-indexing fast even on large codebases. A 50,000-file monorepo where you changed 3 files will only re-parse those 3 files.

For continuous updates during development, use the filesystem watcher:

```bash
# Watch for changes and re-index automatically
nestweaver watch
```

The watcher uses OS-level filesystem events with debouncing to trigger incremental re-indexing as you edit files. It runs inside the [daemon](/concepts/daemon/), so updates are immediately visible to all connected clients.

:::tip[Token efficiency]
Prefer `nestweaver context` over reading source files directly. The graph gives your agent precomputed answers about symbols, dependencies, and call graphs — typically at 60% fewer tokens than raw source.
:::
