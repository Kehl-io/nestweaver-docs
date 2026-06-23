---
title: Code Navigation Tools
description: NestWeaver MCP tools for reading symbols, running regex searches, tracing execution flows, and investigating unfamiliar code.
sidebar:
  order: 3
---

Code navigation tools let agents read symbol source code, search indexed text with regex, trace call graphs, and orient on unfamiliar code -- all without reading entire files.

## read_symbols

Read a symbol's source code span (start_line..end_line) without loading the entire file.

Accepts UIDs (`sym:...`), bare names, or FQNs. When ambiguous names match multiple symbols, candidate UIDs are returned for disambiguation.

| Parameter           | Type       | Required | Description                                                                  |
| ------------------- | ---------- | -------- | ---------------------------------------------------------------------------- |
| `targets`           | `string[]` | Yes      | Symbol UIDs (`sym:...`), names, or FQNs to read.                             |
| `include_neighbors` | `integer`  | No       | Include N adjacent symbols in the same file. Default 0.                      |
| `token_budget`      | `integer`  | No       | Approximate token cap for the combined output.                               |
| `root`              | `string`   | No       | Repository root for resolving file paths. Default: server working directory. |

## regex_search

Run a Rust regex against indexed text (section bodies, note titles, symbol signatures) with trigram-accelerated pre-filtering.

Use for exact pattern matching. For fuzzy or semantic lookup, use `brain_search` instead.

| Parameter     | Type       | Required | Description                                                                   |
| ------------- | ---------- | -------- | ----------------------------------------------------------------------------- |
| `pattern`     | `string`   | Yes      | Rust regex pattern. Example: `"fn\\s+authenticate"` or `"(?i)todo"`.          |
| `path_prefix` | `string`   | No       | Restrict to nodes whose file path starts with this prefix.                    |
| `kinds`       | `string[]` | No       | Restrict to these node kinds: `Section`, `Note`, `Symbol` (case-insensitive). |
| `limit`       | `integer`  | No       | Maximum results to return. Default: unlimited (capped by candidate budget).   |
| `max_millis`  | `integer`  | No       | Wall-clock time budget in milliseconds. Default 2000.                         |

## count_patterns

Count regex matches across indexed text without returning the matches themselves. Useful for frequency analysis and comparing pattern prevalence.

| Parameter     | Type       | Required | Description                                                                   |
| ------------- | ---------- | -------- | ----------------------------------------------------------------------------- |
| `patterns`    | `string[]` | Yes      | One or more Rust regex patterns to count.                                     |
| `path_prefix` | `string`   | No       | Restrict to nodes whose file path starts with this prefix.                    |
| `kinds`       | `string[]` | No       | Restrict to these node kinds: `Section`, `Note`, `Symbol` (case-insensitive). |

Returns per-pattern `{pattern, total_matches, files_matched, top_files: [{path, count}]}`.

## flow_trace

Trace forward execution flow from a symbol: what it calls, what those call, and so on. Returns a tree of callees.

Best for tracing from entry points (main, request handlers) to understand execution paths. For reverse dependencies ("what calls this?"), use `brain_impact` instead.

| Parameter         | Type      | Required | Description                                                                                            |
| ----------------- | --------- | -------- | ------------------------------------------------------------------------------------------------------ |
| `symbol`          | `string`  | Yes      | Symbol name (e.g. `"handleRequest"`) or full UID to trace from.                                        |
| `max_depth`       | `integer` | No       | Maximum traversal depth. Default 10.                                                                   |
| `response_format` | `string`  | No       | `"concise"` returns function name chain only; `"detailed"` (default) adds file paths, UIDs, and depth. |

Classes are auto-expanded to their methods since classes have no direct CALLS edges.

## investigate

Orient on an unfamiliar topic in one call: runs hybrid PPR+BM25 retrieval, groups results into architectural domains, inlines high-confidence source bodies, and returns a token-budgeted map with a `bundle_id` for drill-down.

| Parameter      | Type      | Required | Description                                                                                           |
| -------------- | --------- | -------- | ----------------------------------------------------------------------------------------------------- |
| `query`        | `string`  | Yes      | The topic, feature, or subsystem to orient on (e.g. `"device pairing"`, `"how indexing works"`).      |
| `scope`        | `string`  | No       | Optional scope: `"project:<slug>"`, `"repo:<name>"`, or `"vault"`/`"all"` (default = no restriction). |
| `token_budget` | `integer` | No       | Approximate token cap for the map (chars / 4). Default 4000. Hard-capped at 16000.                    |
| `root`         | `string`  | No       | Filesystem root for reading inline source bodies.                                                     |

Drill into entries with `investigate_expand` (by `asset_id`) or fill all bodies with `investigate_hydrate`.

## investigate_expand

Drill into specific `investigate` map entries: fetch full source bodies and immediate neighbors (callers/callees for symbols, wikilink sources for notes).

| Parameter   | Type       | Required | Description                                                             |
| ----------- | ---------- | -------- | ----------------------------------------------------------------------- |
| `bundle_id` | `string`   | Yes      | The `bundle_id` returned by a prior `investigate` call.                 |
| `targets`   | `string[]` | Yes      | `asset_id` values from the investigate map, or raw node UIDs to expand. |
| `root`      | `string`   | No       | Filesystem root for reading source bodies.                              |

Expanded entries always have `body_complete: true` (full untruncated body). Bundles expire 24 hours after creation.

## investigate_hydrate

Fill in source bodies for all un-hydrated entries in an `investigate` bundle. This is the bulk version of `investigate_expand`, bounded by a token budget.

| Parameter      | Type      | Required | Description                                                                                |
| -------------- | --------- | -------- | ------------------------------------------------------------------------------------------ |
| `bundle_id`    | `string`  | Yes      | The `bundle_id` returned by a prior `investigate` call.                                    |
| `token_budget` | `integer` | No       | Approximate token cap for hydrated bodies (chars / 4). Default 4000. Hard-capped at 16000. |
| `root`         | `string`  | No       | Filesystem root for reading source bodies.                                                 |

Entries with `body_complete: true` have the full source inlined. Entries with `body_complete: false` were truncated; use `read_symbols` for the rest.
