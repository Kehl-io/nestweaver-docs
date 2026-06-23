---
title: Token-Efficient Workflows
description: Strategies for minimizing token usage when AI agents query NestWeaver — CLI vs MCP, filtering, response formats, and budget control.
sidebar:
  order: 1
---

Input tokens are 85-95% of AI coding bills. NestWeaver's graph-based retrieval is designed to minimize token spend — but how you query matters. This guide covers the strategies that make the biggest difference.

## The core principle

NestWeaver gives your agent precomputed answers instead of raw files. But even within NestWeaver, there's a spectrum from "broad and expensive" to "narrow and cheap."

**Rule of thumb:** Filter early, use concise format for scanning, and switch to detailed only for the results you need to read deeply.

## MCP vs CLI: choose by context

NestWeaver offers two query interfaces. They return the same data, but their token costs differ significantly.

| Interface | When to use | Token overhead |
|-----------|------------|----------------|
| **MCP tools** | Main conversation loop, interactive work | ~18K tokens for tool schemas (loaded once per session) |
| **CLI via Bash** | Subagents, batch scripts, hooks | Zero schema overhead — precomputed answers only |

**Use CLI in subagents for ~40-60% fewer tokens per query.** The CLI returns the same data without loading tool schemas into context. Always pass `--json` for machine-readable output.

```bash
# In a subagent or script — CLI is cheaper
nestweaver context "UserService" --token-budget 2000 --json

# In the main conversation loop — MCP is natural
# (tool schemas are already loaded)
```

## Filter for precision

Every context query accepts filters that narrow results before ranking. Unfiltered queries return broader but less focused results — more tokens for less signal.

| Filter | Effect | Example |
|--------|--------|---------|
| `repos` | Limit to specific repositories | `repos: ["my-backend"]` |
| `tags` | Filter by tag | `tags: ["project/auth"]` |
| `path_prefix` | Limit to a directory | `path_prefix: "src/services/"` |
| `kinds` | Symbol, Note, or Section only | `kinds: ["Symbol"]` |
| `exclude_tags` | Remove unwanted categories | `exclude_tags: ["archived"]` |

## Use response_format wisely

Every context and search tool supports `response_format`:

- **`"concise"`** — Titles, kinds, and UIDs only. Use for scanning many results. ~60% fewer tokens than detailed.
- **`"detailed"`** — Adds text excerpts, scores, and full metadata. Use when you need to read the content.

**Pattern:** Query with `concise` first to find the right nodes, then use `read_symbols` or `note_get` on the specific items you need.

## Control the token budget

The `token_budget` parameter (default: 3000) controls how much context NestWeaver returns. The graph fills the budget with the highest-ranked symbols — Personalized PageRank ensures the most structurally relevant results come first.

```bash
# Tight — just the entry points
nestweaver context "payment processing" --token-budget 1000

# Standard — good for most tasks
nestweaver context "payment processing" --token-budget 3000

# Generous — deep architectural understanding
nestweaver context "payment processing" --token-budget 8000
```

## Choose the right tool

| Need | Tool | Why |
|------|------|-----|
| Structural context around a topic | `brain_context` | PPR-ranked, token-budget-aware |
| Keyword search | `brain_search` | BM25, fast lookup |
| Read a specific symbol's source | `read_symbols` | Cheapest — returns only the span you need |
| Project-wide overview | `project_context` | Pre-scoped to a project's subgraph |
| Check before changing code | `blast_radius` | Shows downstream dependents |

## Summary

1. **Use CLI in subagents** — 40-60% fewer tokens vs MCP
2. **Filter with repos/tags/path_prefix** — narrow before ranking
3. **Use `concise` format for scanning** — switch to `detailed` only when needed
4. **Set explicit token budgets** — don't accept the default if you need less
5. **Use `read_symbols` for specific lookups** — cheapest way to read source
