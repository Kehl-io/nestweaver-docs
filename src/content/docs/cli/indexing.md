---
title: Indexing & Watch
description: Index your codebase into NestWeaver's knowledge graph and keep it updated with file watching.
sidebar:
  order: 2
---

Indexing is the first step to building your knowledge graph. NestWeaver parses source files across 32 languages, resolves cross-file references with confidence scoring, computes PageRank for symbol importance, and stores everything in a LadybugDB graph database. The `index` command auto-detects the repo root from `.git` and supports incremental re-indexing on subsequent runs — only changed files are re-parsed.

## Command reference

| Command       | Description                                             | Key Flags                                                                                                                          |
| ------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `index`       | Parse and index a repository                            | `--repo`, `--name`, `--db`, `--force`, `--with-trigrams`, `--with-git-activity`, `--config`, `--json`, `--fail-on-skip`, `--setup` |
| `watch`       | Live re-indexing via filesystem watcher                 | positional repo path, `--db`, `--instance`, `--config`, `--refresh-wiki-hours`, `--force`                                          |
| `watch-stop`  | Stop the daemon's active file watcher                   | `--db`                                                                                                                             |
| `list-repos`  | List all indexed repositories                           | `--instance`, `--json`, `--db`, `--config`                                                                                         |
| `remove-repo` | Remove a repo and all its data from the graph           | positional target, `--db`                                                                                                          |
| `prune-stale` | Remove repos/vaults whose source paths no longer exist  | `--db`, `--json`                                                                                                                   |
| `stale-check` | Compare each repo's indexed SHA and resolver generation | `--json`, `--db`, `--config`                                                                                                       |

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

## What indexing skips and discloses

Indexing reports what it could not read instead of failing silently or failing the whole run. `--json` lists each skip under `skipped_files` with a reason code, and `coverage_status` reads `"degraded"` whenever a skip is not a deliberate exclusion. `--fail-on-skip` exits 1 in that case, which is the gate to use in CI.

- **Unreadable files and directories.** An unreadable source in a language that cannot define an API contract is skipped and disclosed. An unreadable JavaScript, TypeScript, Java or Kotlin source fails the index instead, because it might be a route handler and skipping it would publish an incomplete contract set. An unreadable directory gets one disclosure, not one per file.
- **Files that vanish mid-scan**, for example during a checkout or rebase, are indexed as deletions.
- **Binary files** with a source extension (an MPEG transport stream named `.ts`) are skipped as one `binary` row.
- **Ignored files.** `.gitignore`, `.ignore` and `.git/info/exclude` are honoured, including for tracked files. The watcher reconciles edits to those files: newly hidden sources leave the graph and newly visible ones are indexed.
- **A malformed OpenAPI spec** is skipped and disclosed as degraded coverage rather than failing every index. Pathologically nested specs are refused quickly.
- **Unsafe roots.** System pseudo-filesystems such as `/proc`, `/sys` and `/dev`, and other system roots, are refused as repo or vault roots.

Indexing never runs programs from the repository it reads. Git is called with the repository's hooks, fsmonitor, credential helpers, filter, textconv and external-diff drivers, pager and askpass programs disabled, and Git metadata that points into another repository (a forged `commondir` or gitfile) is refused. Working-tree `status` and `diff` calls also pass `--ignore-submodules=dirty`, so a submodule's own filter programs never run; a submodule whose recorded commit moved still shows as changed. Submodule contents are not indexed.

Go files marked `//go:build ignore` (or the legacy `// +build ignore`) are left out of package resolution and build variants, as `go build` leaves them out.

## Upgrading to 12.2.2

12.2.2 changes how calls and imports resolve (resolver generation 12, parsed cache 8) and how vault links are derived. After upgrading, run both steps once:

```bash
# Once per repository: a full re-index, not an incremental one
nestweaver index --repo ./my-project --db ./nestweaver.lbug --force

# Once per vault: re-derive notes and links
nestweaver brain refresh ./my-vault --db ./nestweaver.lbug
```

Until a repository is re-indexed, `stale-check` exits 2 for it, `dead-code` refuses, and `blast-radius` misses the new edges. The vault refresh is not automatic in this release, because the Markdown derivation version did not change; without it, `[[wikilink]]` values in frontmatter relationships and `[[Note#^id]]` block references keep their old, unresolved state.

## Upgrading: re-index with `--force`

Every graph records the resolver generation that built it, and compatibility is an exact match. When a release changes how calls and imports resolve, `nestweaver stale-check` reports the repo as `outdated_resolver` and exits 2, `dead-code` refuses, and rankings are marked stale. Re-index once per repo with `--force`:

```bash
nestweaver stale-check --db ./nestweaver.lbug
nestweaver index --repo ./my-project --db ./nestweaver.lbug --force
```

A plain `index` is not enough: a generation-stale repo is already at git HEAD, so the incremental path finds nothing to do. 12.2.2 moves the resolver generation from 11 to 12 (improved Go, Python, Kotlin and Java import resolution, method calls on call and `new` receivers, and `new Foo()` call edges), so every repo needs one forced re-index after that upgrade.

An index that is killed part-way is recorded as incomplete: `stale-check` reports the repo as `incomplete`, and the next `index` rebuilds it in full.

## Live re-indexing

```bash
# Watch for changes and re-index incrementally
nestweaver watch

# Watch a specific repo
nestweaver watch ./my-project
```

The watcher monitors for creates, modifies, and deletes of supported source files. Changes are debounced into 2-second windows, and each batch triggers an incremental re-index. This keeps the graph current as you code without manual re-runs. A watcher batch resolves against the whole repository the same way a full index does, so re-exports and type-aware member calls into unchanged files keep their edges; a file the batch cannot re-parse keeps its existing edges. Press Ctrl-C to stop cleanly.

The watcher runs inside the daemon. If a `watch` was killed without a clean shutdown, `nestweaver watch-stop` releases the watcher slot (it does not start a daemon), or `watch --force` replaces the old watcher. A watcher that cannot publish a batch is reported by `nestweaver brain status`.

## Managing indexed repos

```bash
# List all indexed repos
nestweaver list-repos --json

# Remove a repo by name, path, or UID
nestweaver remove-repo my-project

# Clean up repos whose directories were deleted or moved
nestweaver prune-stale
```

`remove-repo` accepts a repo name, remote URL, filesystem path, `file://` URL, or UID, including the exact `URL:` and UID lines `list-repos` prints. A name several repos share is ambiguous: the command exits 3 and lists them, so pass the UID. It cascade-deletes all symbols, files, services, and contracts belonging to that repo. On-disk files are not touched.

`prune-stale` scans every indexed repo and vault, checks whether its source path still exists on disk, and removes those whose path is not found. A path that cannot be checked (for example, an unreadable parent directory) is kept and reported as a warning. Run it after reorganizing or deleting project directories to keep the graph clean.
