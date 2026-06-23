---
title: Vault & Notes Tools
description: NestWeaver MCP tools for reading notes, querying backlinks, managing knowledge sources, and auditing vault health.
sidebar:
  order: 5
---

Vault and notes tools let agents read markdown notes, follow backlinks, manage indexed sources, and audit vault health.

## note_get

Fetch a vault note's full markdown body or specific sections, plus structural metadata (frontmatter, heading outline, tags).

Use after `brain_search` or `brain_context` identifies a relevant note. For code symbols, use `read_symbols` instead.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `uid` | `string` | No | Note UID (e.g. `note:vlt:MyVault:abc123`). Preferred for unambiguous lookup. |
| `title` | `string` | No | Note title (case-insensitive). Returns the first match if multiple notes share the same title. |
| `include_body` | `boolean` | No | Include the full markdown body. Default true. Set to false to get only metadata. |
| `sections` | `string[]` | No | List of heading names. If provided, returns only those sections instead of the full body. Case-insensitive match. |

Provide either `uid` or `title`.

:::tip
Use the `sections` parameter to retrieve only specific heading sections. This is significantly more token-efficient for large notes.
:::

## backlinks

Find every note that wiki-links TO a specific target note, revealing the reverse link graph.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `uid` | `string` | No | Note UID. Preferred for unambiguous lookup. |
| `title` | `string` | No | Note title (case-insensitive match). Returns backlinks for the first matching note. |

Provide either `uid` or `title`. Returns source note paths, linking sections, confidence scores, and display text. For forward links (what a note links to), read the note body with `note_get`.

## brain_add_source

Index a new vault, code repo, or markdown folder into the brain graph. Auto-detects source type from directory contents.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | `string` | Yes | Absolute or `~/`-relative directory path to the vault, repo, or markdown folder to index. |
| `name` | `string` | No | Friendly display name (vaults only). Defaults to the directory name. Has no effect for code repos. |

Check `brain_status` first to avoid re-indexing already-indexed sources.

## brain_remove_source

Remove an indexed code repository or markdown vault from the brain graph permanently.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `target` | `string` | Yes | Repo name, vault name, filesystem path, `file://` URL, or UID of the source to remove. |

Removal is permanent. The source must be re-indexed with `brain_add_source` to restore. Ambiguous targets matching multiple sources require a UID to disambiguate.

## brain_broken_links

Find wikilinks in the vault that did not resolve cleanly -- ambiguous or low-confidence targets (confidence < 1.0).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `max_suggestions` | `integer` | No | Max suggested target UIDs per broken link. Default 5. |
| `limit` | `integer` | No | Max broken links to return (default 50). Total count is always reported. |

Each result includes fuzzy-matched suggested target UIDs for repair. Only detects wikilink resolution issues, not broken external URLs.

## brain_orphan_documents

Find notes with zero inbound and zero outbound wikilinks -- disconnected from the knowledge graph.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `vault` | `string` | No | Restrict to this vault UID. |
| `path_prefix` | `string` | No | Restrict to notes whose file path starts with this prefix. |
| `allowlist` | `string[]` | No | Note paths/titles to exclude. Overrides the default index/MOC allowlist when provided. |
| `limit` | `integer` | No | Max orphan documents to return (default 50). Total count is always reported. |

Default allowlist excludes `Projects.md`, `index.md`, `README.md`, and MOC-containing paths.

## brain_topic_clusters

Discover thematic structure of a vault by running Leiden community detection over the note-to-note wikilink graph.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `resolution` | `number` | No | Leiden resolution -- higher yields more, smaller clusters. Default 0.5. |
| `limit` | `integer` | No | Max clusters to return (default 50). Total count is always reported. |

Each cluster is labelled by its most central member (highest PageRank).

## brain_tag_graph

Explore tag relationships in a vault via co-occurrence analysis.

Two modes:
1. **With `tag`** -- returns co-occurring tags for a focus tag, sorted by shared-note count.
2. **Without `tag`** -- returns the full tag co-occurrence graph for all tags, sorted by note count descending.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tag` | `string` | No | Focus tag (with or without leading `#`). When omitted, returns the full tag co-occurrence graph. |
| `limit` | `integer` | No | Max tags to return in the all-tags listing (default 50). Ignored when a specific tag is queried. |

## brain_doc_stats

Get a one-shot health summary of a vault's document graph: note counts, broken links, orphans, tag distribution, and notes-by-year.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `top_tags_limit` | `integer` | No | Max entries in `top_tags`. Default 10. |

Returns: `total_notes`, `total_wikilinks`, `broken_wikilinks`, `orphans`, `avg_outdegree`, `top_tags`, `notes_by_year`.

## brain_memory_lint

Audit a memory-bank vault for health problems across seven categories: stale notes, contradictions, orphans, broken wikilinks, supersession chains, schema drift, and dangling relationships.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | `integer` | No | Max results per lint category (default 50). Totals are always reported. |

All seven keys are always present in output, even on an empty vault. Schema drift checks against `_templates/<kind>.md` templates.

## brain_memory_consolidate

Propose promotions of vault notes up memory tiers (daily logs to ideas to project files). Dry-run by default.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `apply` | `boolean` | No | Set to true to execute moves. Default false (safe dry-run). |
| `limit` | `integer` | No | Max proposals to return (default 50). Total count is always reported. |

Promotes daily logs referenced by 3+ idea notes (over 14 days old) and ideas referenced by both `sync.md` and `status.md`.

## brain_memory_related

Walk the typed relationship graph from a note -- Supersedes, DependsOn, CausedBy, RelatesTo -- without generic wikilink noise.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `uid` | `string` | Yes | Seed note UID to traverse from. |
| `edge_types` | `string[]` | No | Edge types to follow: `Supersedes`, `DependsOn`, `CausedBy`, `RelatesTo` (case/format-insensitive). Default: all four. |
| `depth` | `integer` | No | Max BFS depth. Default 2. |

Returns only typed neighbours, not generic wikilinks.
