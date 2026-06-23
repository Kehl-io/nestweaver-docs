---
title: Context Tools
description: NestWeaver MCP tools for retrieving ranked context, searching the knowledge graph, and generating project overviews.
sidebar:
  order: 2
---

Context tools retrieve ranked, token-budgeted information from the knowledge graph. They are the primary entry point for understanding code and notes before reading source files.

## brain_context

Retrieve PPR-ranked structural context from the knowledge graph, seeded by symbol names, note titles, or keywords. Returns mixed-kind results (Symbol, Note, Section, Tag, Heading) within a token budget.

Use `brain_context` as the primary entry point for understanding a topic. Seed with specific names (e.g. `AuthService.validate`), not broad terms. Filter with `repos`, `tags`, `path_prefix`, and `kinds` for precision.

| Parameter                | Type       | Required | Description                                                                                                                                                                               |
| ------------------------ | ---------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `seeds`                  | `string[]` | Yes      | One or more seed strings to anchor the PPR walk. Accepts note titles, tag names (with or without `#`), symbol names, free-text terms, or UIDs (`sym:`, `note:`, `head:`, `sec:`, `tag:`). |
| `token_budget`           | `integer`  | No       | Approximate cap on the connected list (chars / 4). Default 2000.                                                                                                                          |
| `response_format`        | `string`   | No       | `"concise"` returns names and relationships only; `"detailed"` (default) adds file paths, relevance scores, and UIDs.                                                                     |
| `repos`                  | `string[]` | No       | Filter to specific repo UIDs or names (post-PPR).                                                                                                                                         |
| `vaults`                 | `string[]` | No       | Filter to specific vault UIDs or names (post-PPR).                                                                                                                                        |
| `kinds`                  | `string[]` | No       | Include only nodes with these kind prefixes (e.g. `Symbol`, `Note`, `Section`). Case-insensitive prefix match.                                                                            |
| `path_prefix`            | `string`   | No       | Include only nodes whose file path starts with this prefix.                                                                                                                               |
| `tags`                   | `string[]` | No       | Include only nodes tagged with any of these tags. Symbol nodes are always kept.                                                                                                           |
| `exclude_tags`           | `string[]` | No       | Exclude nodes tagged with any of these tags.                                                                                                                                              |
| `weight_ppr`             | `number`   | No       | PPR ranking weight for hybrid RRF fusion. Default 0.7.                                                                                                                                    |
| `weight_bm25`            | `number`   | No       | BM25 text search weight for hybrid RRF fusion. Default 0.3.                                                                                                                               |
| `weight_semantic`        | `number`   | No       | Semantic embedding weight for hybrid RRF fusion. Default 0.0 (disabled until embeddings are generated).                                                                                   |
| `since`                  | `string`   | No       | ISO 8601 timestamp. Only return Note/Section nodes modified after this time. Symbol nodes always kept.                                                                                    |
| `recency_weight`         | `number`   | No       | Multiplier for age-decay boost. 0 = disabled (default). 1.0 = same-day node ranks ~2x a year-old node.                                                                                    |
| `recency_half_life_days` | `number`   | No       | Half-life for age-decay in days. Default 30.                                                                                                                                              |
| `intent`                 | `string`   | No       | Query intent hint: `"find-definition"`, `"understand-architecture"`, `"analyze-impact"`, or `"general-context"`. Adjusts ranking strategy.                                                |
| `include_seeds`          | `boolean`  | No       | When true, include the full seeds array in the response. Default false.                                                                                                                   |
| `include_bodies`         | `boolean`  | No       | When true, embed high-relevance result source bodies inline under `inline_body`. Only results clearing the relevance threshold (default 0.75) get a body. Default false.                  |
| `root`                   | `string`   | No       | Filesystem root for resolving source spans for inline bodies. Only relevant with `include_bodies=true`.                                                                                   |
| `prf`                    | `boolean`  | No       | When true, run pseudo-relevance-feedback query expansion on the BM25 leg. Improves recall on natural-language seeds. Default false.                                                       |
| `rerank`                 | `boolean`  | No       | When true, rerank top-N candidates before truncation. Default false.                                                                                                                      |

:::tip[Token efficiency]
Filter aggressively with `repos`, `tags`, `path_prefix`, and `kinds` to reduce noise. Use `response_format: "concise"` when scanning results, and switch to `"detailed"` only when you need UIDs for follow-up queries.
:::

## brain_search

Find notes, headings, sections, tags, and code symbols by keyword or phrase using BM25 full-text search.

Use `brain_search` for keyword or phrase lookup. For structural context ("what's connected to X"), use `brain_context` instead.

| Parameter         | Type      | Required | Description                                                                                                                     |
| ----------------- | --------- | -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `query`           | `string`  | Yes      | Free-text query. Natural language works. Example: `"database migration"` or `"AuthService"`.                                    |
| `limit`           | `integer` | No       | Maximum results to return. Default 20.                                                                                          |
| `response_format` | `string`  | No       | `"concise"` returns note titles and kinds only; `"detailed"` (default) adds section text excerpts, BM25 scores, and vault UIDs. |
| `include_bodies`  | `boolean` | No       | When true (detailed mode only), embed high-relevance hit source bodies inline. Default false.                                   |
| `root`            | `string`  | No       | Filesystem root for reading source spans. Only relevant with `include_bodies=true`.                                             |
| `prf`             | `boolean` | No       | When true, run pseudo-relevance-feedback query expansion. Default false.                                                        |
| `rerank`          | `boolean` | No       | When true (detailed mode only), rerank top-N hits before truncation. Default false.                                             |

## project_context

Retrieve all context for a named project: notes, symbols, and sections ranked by PPR within the project's subgraph, bounded by token budget.

Use when you know the project name. For ad-hoc topics, use `brain_context` with seeds instead.

| Parameter                | Type       | Required | Description                                                                                                                                    |
| ------------------------ | ---------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `project`                | `string`   | Yes      | Project name (e.g. `"AuthService"`), alias, or UID.                                                                                            |
| `token_budget`           | `integer`  | No       | Approximate token cap (chars / 4). Default 3000.                                                                                               |
| `kinds`                  | `string[]` | No       | Filter result kinds: `"Symbol"` for code, `"Note"` for documents. Case-insensitive prefix match.                                               |
| `include_components`     | `boolean`  | No       | For composite projects, include content from component sub-projects. Default true.                                                             |
| `since`                  | `string`   | No       | ISO 8601 timestamp. Only return Note/Section nodes modified after this time.                                                                   |
| `recency_weight`         | `number`   | No       | Multiplier for age-decay boost. Default 0.0 (disabled).                                                                                        |
| `recency_half_life_days` | `number`   | No       | Half-life for age-decay in days. Default 30.                                                                                                   |
| `include_seeds`          | `boolean`  | No       | When true, include the full seeds array in the response. Default false.                                                                        |
| `intent`                 | `string`   | No       | Query intent hint: `"find-definition"`, `"understand-architecture"` (default for project_context), `"analyze-impact"`, or `"general-context"`. |

## get_summary

Generate deterministic architectural summaries at three granularity levels: symbol, file, or cluster. Derived from graph data without an LLM.

| Parameter      | Type      | Required | Description                                                                                                                              |
| -------------- | --------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `level`        | `string`  | No       | Summary granularity: `"symbol"` (per-function/class), `"file"` (per-file exports, default), or `"cluster"` (per-community architecture). |
| `target`       | `string`  | No       | Filter by file path, symbol name, or cluster name substring. Only matching summaries are returned.                                       |
| `token_budget` | `integer` | No       | Approximate token cap. Default unlimited.                                                                                                |

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
| `limit`     | `integer` | No       | Max affected symbols to return (default 50). Total count is always reported.            |
