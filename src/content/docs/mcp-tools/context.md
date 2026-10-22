---
title: Context Tools
description: NestWeaver MCP tools for retrieving ranked context, searching the knowledge graph, and generating project overviews.
sidebar:
  order: 2
---

Context tools retrieve ranked, token-budgeted information from the knowledge graph. They are the primary entry point for understanding code and notes before reading source files.

## code_context

Code-only Personalized PageRank. It does not return notes, tags, or wikilinks. Use it for the symbols around a function or class. `brain_context` is the code-plus-notes walk.

A seed may be a symbol name, a `sym:` UID, or a repo-relative file path. The engine expands a path to the symbols in that file. A question belongs on `investigate`.

| Parameter | Type       | Required | Description                                                                                                                                                       |
| --------- | ---------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `seeds`   | `string[]` | Yes      | Symbol names, `sym:` UIDs, `path::name` or `Class::method` names, or one repo-relative file path. At most 256 seeds; duplicates are collapsed.                    |
| `limit`   | `integer`  | No       | Maximum connected symbols to return. Default 500. Maximum 5000. The response reports when it truncates.                                                           |
| `intent`  | `string`   | No       | `find-definition`, `understand-architecture`, `analyze-impact`, `general-context`, or `project-context`, plus their short aliases. Omit for the standard damping. |

## brain_context

Retrieve PPR-ranked structural context from the knowledge graph, seeded by symbol names, note titles, tags, or UIDs. Returns mixed-kind results (Symbol, Note, Section, Tag, Heading) within a token budget.

Use `brain_context` as the primary entry point for understanding a topic. Seed with specific names (e.g. `AuthService`, `AuthService::validate`), not broad terms. Seeds are names, not questions: a question resolves to no seed and returns the `not_found` envelope, whose message names the `investigate` call to make instead. An exact-case symbol name ranks ahead of fuzzy matches. Filter with `repos`, `tags`, `path_prefix`, and `kinds` for precision; repo filters apply before the seed cap.

| Parameter                | Type       | Required | Description                                                                                                                                                                                                                                                         |
| ------------------------ | ---------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `seeds`                  | `string[]` | Yes      | Seed strings to anchor the PPR walk: note titles, tag names (with or without `#`), symbol names (also `path::name`, `Class::method`, `path::<module>`), or UIDs (`sym:`, `note:`, `head:`, `sec:`, `tag:`, `vlt:`, `repo:`). At most 256; duplicates are collapsed. |
| `token_budget`           | `integer`  | No       | Approximate cap on the connected list (chars / 4), 1--16000. Default 2000.                                                                                                                                                                                          |
| `limit`                  | `integer`  | No       | Maximum connected results, 1--1000.                                                                                                                                                                                                                                 |
| `response_format`        | `string`   | No       | `"concise"` returns UID, kind, title and location per node; `"detailed"` (default) adds relevance scores and inline bodies.                                                                                                                                         |
| `repos`                  | `string[]` | No       | Filter to specific repo UIDs or names, at most 100.                                                                                                                                                                                                                 |
| `vaults`                 | `string[]` | No       | Filter to specific vault UIDs or names, at most 100.                                                                                                                                                                                                                |
| `kinds`                  | `string[]` | No       | Include only nodes with these kind prefixes (e.g. `Symbol`, `Note`, `Section`), at most 32. Case-insensitive prefix match; an unknown kind is an invalid argument.                                                                                                  |
| `path_prefix`            | `string`   | No       | Include only nodes whose file path starts with this prefix.                                                                                                                                                                                                         |
| `tags`                   | `string[]` | No       | Include only notes and sections with these tags (at most 100). Symbol nodes have no tags and are dropped.                                                                                                                                                           |
| `exclude_tags`           | `string[]` | No       | Exclude nodes tagged with any of these tags (at most 100).                                                                                                                                                                                                          |
| `weight_ppr`             | `number`   | No       | PPR ranking weight. Omitted calls use 0.40.                                                                                                                                                                                                                         |
| `weight_bm25`            | `number`   | No       | BM25 weight. Omitted calls use 0.25.                                                                                                                                                                                                                                |
| `weight_semantic`        | `number`   | No       | Semantic weight. The stored default is 0.35. The semantic leg is skipped until `nestweaver embed` has written vectors.                                                                                                                                              |
| `since`                  | `string`   | No       | ISO 8601 timestamp. Only return Note/Section nodes modified after this time. Symbol nodes always kept.                                                                                                                                                              |
| `recency_weight`         | `number`   | No       | Multiplier for age-decay boost. 0 = disabled (default). 1.0 = same-day node ranks ~2x a year-old node.                                                                                                                                                              |
| `recency_half_life_days` | `number`   | No       | Half-life for age-decay in days. Default 30.                                                                                                                                                                                                                        |
| `intent`                 | `string`   | No       | Query intent hint: `find-definition`, `understand-architecture`, `analyze-impact`, `general-context`, or `project-context`, plus their short aliases. Adjusts ranking strategy.                                                                                     |
| `include_seeds`          | `boolean`  | No       | When true, include the full seeds array in the response. Default false.                                                                                                                                                                                             |
| `include_bodies`         | `boolean`  | No       | When true, embed high-relevance result source bodies inline under `inline_body`. Only results clearing the relevance threshold (default 0.75) get a body. Default false.                                                                                            |
| `root`                   | `string`   | No       | Filesystem root for reading inline bodies (default: each symbol's recorded repo root). Must be inside an indexed repo or vault, or a linked worktree of one. Only used with `include_bodies=true`.                                                                  |
| `prf`                    | `boolean`  | No       | When true, run pseudo-relevance-feedback query expansion on the BM25 leg. Improves recall on natural-language seeds. Default false.                                                                                                                                 |
| `rerank`                 | `boolean`  | No       | When true, rerank top-N candidates before truncation. Default false.                                                                                                                                                                                                |
| `no_cache` / `cache`     |            | No       | `no_cache: true` (or `cache: "bypass"`) skips the response cache.                                                                                                                                                                                                   |

:::tip[Token efficiency]
Filter aggressively with `repos`, `tags`, `path_prefix`, and `kinds` to reduce noise. Use `response_format: "concise"` when scanning results; concise rows still carry the UID and location you need for a follow-up query. Switch to `"detailed"` only when you need relevance scores or bodies.
:::

## brain_search

Find notes, headings, sections, tags, and code symbols by keyword or phrase using BM25 full-text search.

Use `brain_search` for keyword or phrase lookup. For structural context ("what's connected to X"), use `brain_context` instead.

| Parameter         | Type      | Required | Description                                                                                                                                               |
| ----------------- | --------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `query`           | `string`  | Yes      | Free-text query. Natural language works. Example: `"database migration"` or `"AuthService"`.                                                              |
| `limit`           | `integer` | No       | Maximum results per kind, 1--1000. Default 20. Notes and code symbols are capped separately.                                                              |
| `response_format` | `string`  | No       | `"concise"` returns stable UIDs, titles, and kinds; `"detailed"` (default) adds section text excerpts, BM25 scores, and location.                         |
| `include_bodies`  | `boolean` | No       | When true (detailed mode only), embed high-relevance hit source bodies inline. Default false.                                                             |
| `root`            | `string`  | No       | Filesystem root for reading source spans. Must be inside an indexed repo or vault, or a linked worktree of one. Only relevant with `include_bodies=true`. |
| `prf`             | `boolean` | No       | When true, run pseudo-relevance-feedback query expansion. Default false.                                                                                  |
| `rerank`          | `boolean` | No       | When true (detailed mode only), rerank top-N hits before truncation. Default false.                                                                       |

## project_context

Retrieve all context for a named project: notes, symbols, and sections ranked by PPR within the project's subgraph, bounded by token budget.

Use when you know the project name. For ad-hoc topics, use `brain_context` with seeds instead.

| Parameter                | Type       | Required | Description                                                                                                                                                                         |
| ------------------------ | ---------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `project`                | `string`   | Yes      | Project name (e.g. `"AuthService"`), alias, or UID.                                                                                                                                 |
| `token_budget`           | `integer`  | No       | Approximate token cap, 1--16000. Omitted calls follow `response_format`: about 1000 for concise (the default) and about 3000 for detailed.                                          |
| `response_format`        | `string`   | No       | `"concise"` (default) returns UID, kind, title and location per node; `"detailed"` adds relevance.                                                                                  |
| `repos`                  | `string[]` | No       | Limit code to these repo UIDs or names, at most 100. A repo that is not indexed is reported as a repo miss, not as "project not found".                                             |
| `path_prefix`            | `string`   | No       | Include only nodes whose file path starts with this prefix.                                                                                                                         |
| `tags` / `exclude_tags`  | `string[]` | No       | Include or exclude notes with these tags, at most 100 each.                                                                                                                         |
| `kinds`                  | `string[]` | No       | Filter result kinds: `"Symbol"` for code, `"Note"` for documents, at most 32. Case-insensitive prefix match; an unknown kind is refused.                                            |
| `no_embed`               | `boolean`  | No       | Skip semantic ranking. Default false.                                                                                                                                               |
| `include_components`     | `boolean`  | No       | For composite projects, include content from component sub-projects. Default true.                                                                                                  |
| `since`                  | `string`   | No       | ISO 8601 timestamp. Only return Note/Section nodes modified after this time.                                                                                                        |
| `recency_weight`         | `number`   | No       | Multiplier for age-decay boost. Default 0.0 (disabled).                                                                                                                             |
| `recency_half_life_days` | `number`   | No       | Half-life for age-decay in days. Default 30.                                                                                                                                        |
| `include_seeds`          | `boolean`  | No       | When true, include the full seeds array in the response. Default false.                                                                                                             |
| `intent`                 | `string`   | No       | Query intent hint: `find-definition`, `understand-architecture` (default for project_context), `analyze-impact`, `general-context`, or `project-context`, plus their short aliases. |

## get_summary

Generate deterministic architectural summaries at four granularity levels: symbol, file, cluster, or hub. Derived from graph data without an LLM.

| Parameter       | Type      | Required | Description                                                                                                                                                        |
| --------------- | --------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `level`         | `string`  | No       | Summary granularity: `"symbol"` (per-function/class), `"file"` (per-file exports, default), `"cluster"` (per-community architecture), or `"hub"` (most connected). |
| `target`        | `string`  | No       | Filter by file path, symbol name, or cluster name substring. Alias: `name`. A target that matches nothing is a `not_found` miss.                                   |
| `max_summaries` | `integer` | No       | Maximum cluster summaries, 1--1000. Default 50.                                                                                                                    |
| `token_budget`  | `integer` | No       | Approximate token cap; `0` or omitted means unlimited. A first summary larger than the budget is still returned and flagged `budget_exceeded_by_first_item`.       |

## brain_status

Show what knowledge sources are indexed: vault/repo counts, note/tag/wikilink totals, staleness warnings, and search engine availability.

No parameters required. Call at session start to verify expected vaults and repos are loaded.

## brain_guide

Generate a comprehensive orientation guide covering all indexed repos, vaults, cross-repo relationships, and available tools.

No parameters required. Call at session start for a read-once overview before issuing specific queries. Can be expensive on large graphs; prefer `brain_status` for lightweight session initialization.

## brain_diff

Show what changed since the graph was last indexed: files added, modified, or deleted, plus affected symbols. Works with locally-indexed repos only.

| Parameter   | Type      | Required | Description                                                                             |
| ----------- | --------- | -------- | --------------------------------------------------------------------------------------- |
| `repo`      | `string`  | Yes      | Repo name or substring of its URL (e.g. `"nestweaver"`). Matched against indexed repos. |
| `since_sha` | `string`  | No       | Git SHA to compare against. Defaults to the repo's indexed SHA.                         |
| `limit`     | `integer` | No       | Max affected symbols to return, 1--1000 (default 50). Total count is always reported.   |
