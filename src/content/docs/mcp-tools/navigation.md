---
title: Code Navigation Tools
description: NestWeaver MCP tools for reading symbols, running regex searches, tracing execution flows, and investigating unfamiliar code.
sidebar:
  order: 3
---

Code navigation tools let agents read symbol source code, search indexed text with regex, trace call graphs, and orient on unfamiliar code -- all without reading entire files.

## read_symbols

Read a symbol's source code span (start_line..end_line) without loading the entire file.

Accepts UIDs (`sym:...`), bare names, `path::name`, `Class::method`, `path::Class::method`, or `path::<module>` for a file's top-level code. When ambiguous names match multiple symbols, candidates with their file paths are returned for disambiguation. A target that does not resolve is listed under `not_found`, with suggestions per target in `did_you_mean_by_target`.

| Parameter           | Type       | Required | Description                                                                                                                                                                 |
| ------------------- | ---------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `targets`           | `string[]` | Yes      | Symbol UIDs, names, or qualified names to read, at most 1000. Alias: `uids_or_fqns`.                                                                                        |
| `include_neighbors` | `integer`  | No       | Include N adjacent symbols in the same file, 0--255. Default 0. Alias: `neighbors`.                                                                                         |
| `token_budget`      | `integer`  | No       | Approximate token cap for the combined output. A first symbol larger than the budget is cut to its leading lines and flagged `body_truncated: true`.                        |
| `root`              | `string`   | No       | Repository root for resolving file paths. Default: each symbol's recorded repo root. An explicit root must be inside an indexed repo or vault, or a linked worktree of one. |

Reads stay inside the repository: a body read never follows a symlink out of it. If the indexed span no longer matches the file on disk, the response reports the stale or relocated span instead of returning another symbol's body.

## regex_search

Run a Rust regex against indexed text (section bodies and their heading lines, note titles, frontmatter, symbol signatures) with trigram-accelerated pre-filtering. Without a current trigram index it scans instead and returns the same matches.

Use for exact pattern matching. For fuzzy or semantic lookup, use `brain_search` instead.

| Parameter     | Type       | Required | Description                                                                                              |
| ------------- | ---------- | -------- | -------------------------------------------------------------------------------------------------------- |
| `pattern`     | `string`   | Yes      | Rust regex pattern. Example: `"fn\\s+authenticate"` or `"(?i)todo"`. Alias: `query`.                     |
| `path_prefix` | `string`   | No       | Restrict to nodes whose file path starts with this prefix.                                               |
| `kinds`       | `string[]` | No       | Restrict to these node kinds: `Section`, `Note`, `Symbol`, `Frontmatter` (case-insensitive), at most 32. |
| `limit`       | `integer`  | No       | Maximum results to return, 1--10000. Default 50; MCP output shows at most 50 rows.                       |
| `max_millis`  | `integer`  | No       | Wall-clock time budget in milliseconds, 1--600000. Default 2000.                                         |

## count_patterns

Count regex matches across indexed text without returning the matches themselves. Useful for frequency analysis and comparing pattern prevalence.

| Parameter     | Type       | Required | Description                                                                                              |
| ------------- | ---------- | -------- | -------------------------------------------------------------------------------------------------------- |
| `patterns`    | `string[]` | Yes      | One or more Rust regex patterns to count, at most 64.                                                    |
| `path_prefix` | `string`   | No       | Restrict to nodes whose file path starts with this prefix.                                               |
| `kinds`       | `string[]` | No       | Restrict to these node kinds: `Section`, `Note`, `Symbol`, `Frontmatter` (case-insensitive), at most 32. |
| `max_millis`  | `integer`  | No       | Wall-clock budget for the whole call, shared by all patterns, 1--600000. Default 10000.                  |

Returns per-pattern `{pattern, total_matches, files_matched, top_files: [{path, count}], stale_index}`. A pattern the time budget cut short is marked `truncated: true` and its counts are lower bounds. The call also stops when the client cancels or disconnects.

## flow_trace

Trace forward execution flow from a symbol: what it calls, what those call, and so on. Returns a tree of callees.

Best for tracing from entry points (main, request handlers) to understand execution paths. For reverse dependencies ("what calls this?"), use `brain_impact` instead.

| Parameter         | Type      | Required | Description                                                                                                          |
| ----------------- | --------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| `symbol`          | `string`  | Yes      | Symbol name (e.g. `"handleRequest"`), qualified name (`path::name`, `Class::method`), or full UID to trace from.     |
| `repo`            | `string`  | No       | Repo name or UID to resolve the symbol in.                                                                           |
| `max_depth`       | `integer` | No       | Maximum traversal depth, 1--15. Default 10.                                                                          |
| `response_format` | `string`  | No       | `"concise"` returns UID, name and file path per node; `"detailed"` (default) adds repo, depth and boundary metadata. |

Classes are auto-expanded to their methods since classes have no direct CALLS edges.

## investigate

Orient on an unfamiliar topic in one call: runs hybrid PPR+BM25 retrieval, groups results into architectural domains, inlines high-confidence source bodies, and returns a token-budgeted map with a `bundle_id` for drill-down.

| Parameter      | Type      | Required | Description                                                                                                                                                                     |
| -------------- | --------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `query`        | `string`  | Yes      | The topic, feature, or subsystem to orient on (e.g. `"device pairing"`, `"how indexing works"`).                                                                                |
| `scope`        | `string`  | No       | Optional scope: `"project:<slug>"` or `"repo:<name>"`. `"all"` (or omitting it) means no restriction. An unknown project or repo is a miss; a malformed scope is a usage error. |
| `token_budget` | `integer` | No       | Approximate token cap for the map (chars / 4), 1--16000. Default 4000.                                                                                                          |
| `no_embed`     | `boolean` | No       | Skip semantic ranking. Default false.                                                                                                                                           |
| `root`         | `string`  | No       | Filesystem root for reading inline source bodies. Must be inside an indexed repo or vault, or a linked worktree of one.                                                         |

Drill into entries with `investigate_expand` (by `asset_id`) or fill all bodies with `investigate_hydrate`.

## investigate_expand

Drill into specific `investigate` map entries: fetch full source bodies and immediate neighbors (callers/callees for symbols, wikilink sources for notes).

| Parameter   | Type       | Required | Description                                                                          |
| ----------- | ---------- | -------- | ------------------------------------------------------------------------------------ |
| `bundle_id` | `string`   | Yes      | The `bundle_id` returned by a prior `investigate` call.                              |
| `targets`   | `string[]` | Yes      | `asset_id` values from the investigate map, or raw node UIDs to expand, at most 256. |
| `root`      | `string`   | No       | Filesystem root for reading source bodies.                                           |

Expanded entries always have `body_complete: true` (full untruncated body). Bundles expire 24 hours after creation.

## investigate_hydrate

Fill in source bodies for all un-hydrated entries in an `investigate` bundle. This is the bulk version of `investigate_expand`, bounded by a token budget.

| Parameter      | Type      | Required | Description                                                                                |
| -------------- | --------- | -------- | ------------------------------------------------------------------------------------------ |
| `bundle_id`    | `string`  | Yes      | The `bundle_id` returned by a prior `investigate` call.                                    |
| `token_budget` | `integer` | No       | Approximate token cap for hydrated bodies (chars / 4). Default 4000. Hard-capped at 16000. |
| `root`         | `string`  | No       | Filesystem root for reading source bodies.                                                 |

Hydration stops at `token_budget`. Entries with `body_complete: true` have the full source inlined. Entries with `body_complete: false` were truncated; use `read_symbols` for the rest. An unknown or expired `bundle_id` is a `not_found` miss. A map computed while a watcher batch was publishing carries `bundle_not_saved`, and its `bundle_id` cannot be expanded or hydrated; run `investigate` again once the batch finishes.
