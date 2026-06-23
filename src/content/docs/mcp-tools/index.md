---
title: MCP Tools
description: Reference for NestWeaver's 40 MCP tools — context retrieval, code navigation, impact analysis, and vault management.
sidebar:
  order: 1
---

NestWeaver exposes 40 tools via the [Model Context Protocol](https://modelcontextprotocol.io) (MCP), giving AI coding agents structured access to the knowledge graph. Every tool accepts JSON parameters and returns structured JSON responses.

## Setup

Run `nestweaver setup` to auto-configure your agent's MCP connection. Supported agents:

- **Claude Code** — writes to `.mcp.json` in the project root
- **Cursor** — configures the MCP server in Cursor settings
- **Aider** — adds the MCP server to `.aider.conf.yml`
- **Copilot CLI** — registers the MCP endpoint
- **Gemini CLI** — configures via `.gemini/settings.json`
- **Codex** — registers the MCP server for OpenAI Codex
- **Other MCP-compatible agents** — use `nestweaver mcp` to start the server manually

## Tool categories

| Category                                  | Tools                                                                                                                                                                                                                                                     | Purpose                                          |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| [Context](/mcp-tools/context/)            | `brain_context`, `brain_search`, `project_context`, `get_summary`, `brain_status`, `brain_guide`, `brain_diff`                                                                                                                                            | Retrieve ranked context from the knowledge graph |
| [Code Navigation](/mcp-tools/navigation/) | `read_symbols`, `regex_search`, `count_patterns`, `flow_trace`, `investigate`, `investigate_expand`, `investigate_hydrate`                                                                                                                                | Navigate symbols, trace execution flows          |
| [Impact Analysis](/mcp-tools/impact/)     | `blast_radius`, `brain_impact`, `affected_tests`, `dead_code`, `detect_changes`, `hub_nodes`, `bridge_nodes`, `clusters`, `cross_repo_contracts`, `contract_drift`                                                                                        | Assess change impact and architectural risk      |
| [Vault & Notes](/mcp-tools/vault/)        | `note_get`, `backlinks`, `brain_add_source`, `brain_remove_source`, `brain_broken_links`, `brain_orphan_documents`, `brain_topic_clusters`, `brain_tag_graph`, `brain_doc_stats`, `brain_memory_lint`, `brain_memory_consolidate`, `brain_memory_related` | Query vaults, manage knowledge sources           |
| Utility                                   | `stale_check`, `prune_stale`, `set_extension`, `query_extensions`                                                                                                                                                                                         | Graph maintenance and custom metadata            |

## Common parameters

Many tools share these filtering and output parameters:

| Parameter         | Type       | Description                                                                                             |
| ----------------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| `token_budget`    | `integer`  | Approximate token cap for the response (chars / 4). Controls how much context is returned.              |
| `response_format` | `string`   | `"concise"` for names and relationships only; `"detailed"` (default) adds file paths, scores, and UIDs. |
| `repos`           | `string[]` | Filter results to specific repository UIDs or names.                                                    |
| `tags`            | `string[]` | Include only nodes tagged with any of these tags.                                                       |
| `exclude_tags`    | `string[]` | Exclude nodes tagged with any of these tags.                                                            |
| `path_prefix`     | `string`   | Include only nodes whose file path starts with this prefix.                                             |
| `kinds`           | `string[]` | Filter by node kind: `Symbol`, `Note`, `Section`, `Tag`, `Heading`. Case-insensitive prefix match.      |
| `limit`           | `integer`  | Maximum number of results to return. Total counts are always reported regardless of limit.              |

:::tip[MCP vs CLI token costs]
In subagents, hooks, and scripts, use the CLI (`nestweaver context`, `nestweaver search --json`) instead of MCP tools. The CLI returns precomputed answers without loading tool schemas into context, saving approximately 40--60% fewer tokens per query.
:::

## Utility tools

These tools handle graph maintenance and custom metadata. They are not covered on a separate sub-page due to their small number.

### stale_check

Check whether the graph index is current by comparing each repo's indexed git SHA against HEAD.

No parameters required.

### prune_stale

Remove all indexed repos and vaults whose source directories no longer exist on disk.

No parameters required.

### set_extension

Attach custom key-value metadata to any node in a JSON sidecar alongside the database.

| Parameter | Type     | Required | Description                                           |
| --------- | -------- | -------- | ----------------------------------------------------- |
| `uid`     | `string` | Yes      | Node UID to annotate.                                 |
| `key`     | `string` | Yes      | Property name (e.g. `"team_owner"`, `"deprecated"`).  |
| `value`   | `any`    | Yes      | Property value — any JSON value. Overwrites existing. |

### query_extensions

Query custom metadata set via `set_extension`. Two modes: by `uid` (all properties for a node) or by `key` + `value` (find all nodes matching a property).

| Parameter | Type     | Required | Description                                                                               |
| --------- | -------- | -------- | ----------------------------------------------------------------------------------------- |
| `uid`     | `string` | No       | Return all custom properties for this node. When provided, `key` and `value` are ignored. |
| `key`     | `string` | No       | Property name to filter by. Required when not using `uid` mode.                           |
| `value`   | `any`    | No       | Value to match (exact match only). Required when `key` is provided.                       |
