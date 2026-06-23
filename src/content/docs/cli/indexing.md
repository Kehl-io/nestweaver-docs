---
title: Indexing & Watch
description: Index your codebase into NestWeaver's knowledge graph and keep it updated with file watching.
sidebar:
  order: 2
---

Indexing is the first step to building your knowledge graph. NestWeaver parses source files across 32 languages, resolves cross-file references with confidence scoring, computes PageRank for symbol importance, and stores everything in a LadybugDB graph database. The `index` command auto-detects the repo root from `.git` and supports incremental re-indexing on subsequent runs — only changed files are re-parsed.

## Command reference

| Command       | Description                                            | Key Flags                                                                                   |
| ------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `index`       | Parse and index a repository                           | `--repo`, `--name`, `--db`, `--force`, `--with-trigrams`, `--with-git-activity`, `--config` |
| `watch`       | Live re-indexing via filesystem watcher                | `--repo`, `--db`, `--instance`, `--config`, `--refresh-wiki-hours`                          |
| `list-repos`  | List all indexed repositories                          | `--instance`, `--json`, `--db`, `--config`                                                  |
| `remove-repo` | Remove a repo and all its data from the graph          | `--db`                                                                                      |
| `prune-stale` | Remove repos/vaults whose source paths no longer exist | `--db`                                                                                      |

## Indexing a repository

```bash
# Index the current directory (auto-detects .git)
nestweaver index

# Index a specific path with a custom name
nestweaver index --repo ./my-project --name my-project

# Full re-index, bypassing incremental detection
nestweaver index --repo ./my-project --force

# Index with git activity data for recency-based ranking
nestweaver index --repo ./my-project --with-git-activity --config ./instance.toml

# Index with trigram tables for faster regex search
nestweaver index --repo ./my-project --with-trigrams
```

Use `--name` to avoid basename collisions when multiple repos share generic names like "client" or "server". Without it, NestWeaver derives the name from the directory basename, which can clash.

`--with-git-activity` mines git history to write a recency sidecar that demotes dormant code at rank time. This is useful for large repos where recently active files should surface higher in query results.

`--with-trigrams` builds a trigram posting table that accelerates `regex-search`. The trigram index adds some time to the initial build but makes subsequent regex queries significantly faster.

## Live re-indexing

```bash
# Watch for changes and re-index incrementally
nestweaver watch

# Watch a specific repo
nestweaver watch --repo ./my-project
```

The watcher monitors for creates, modifies, and deletes of supported source files. Changes are debounced into 2-second windows, and each batch triggers an incremental re-index. This keeps the graph current as you code without manual re-runs. Press Ctrl-C to stop cleanly.

## Managing indexed repos

```bash
# List all indexed repos
nestweaver list-repos --json

# Remove a repo by name, path, or UID
nestweaver remove-repo my-project

# Clean up repos whose directories were deleted or moved
nestweaver prune-stale
```

`remove-repo` accepts a repo name, filesystem path, `file://` URL, or UID. It cascade-deletes all symbols, files, services, and contracts belonging to that repo. On-disk files are not touched.

`prune-stale` scans every indexed repo and vault, checks whether its source path still exists on disk, and removes any that are gone. Run it after reorganizing or deleting project directories to keep the graph clean.
