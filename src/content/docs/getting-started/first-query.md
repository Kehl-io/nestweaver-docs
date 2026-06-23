---
title: Your First Query
description: Walk through indexing a repo and running your first structural queries with NestWeaver.
sidebar:
  order: 3
---

This guide walks through indexing a repository and querying it with NestWeaver's CLI. By the end you'll know how to look up symbols, control token budgets, search by keyword, and check impact before making changes.

## Index a repository

Start by indexing your project:

```bash
nestweaver index --repo .
# Indexing /path/to/repo → ./nestweaver.lbug
```

NestWeaver parses every supported file using Tree-sitter, resolves cross-file references (CALLS, IMPORTS, USES, ACCESSES edges), and stores the graph locally.

## Ask a structural question

Use `context` to ask about a symbol. NestWeaver uses Personalized PageRank to surface the most relevant connected symbols — callers, dependencies, type definitions, field accesses — ranked by relevance:

```bash
nestweaver context "UserService" --token-budget 2000
```

This returns a focused context window: the symbol itself, its call graph, and the surrounding symbols most relevant to understanding it — all within 2000 tokens.

:::tip[Token efficiency]
Always set a `--token-budget` to control how much context NestWeaver returns. Smaller budgets give tighter, more relevant results. Start with `--token-budget 2000` and increase if you need more breadth.
:::

### Controlling the token budget

The budget determines how many tokens of context NestWeaver packs into the response:

```bash
# Tight focus — just the symbol and its immediate connections
nestweaver context "UserService" --token-budget 1000

# Moderate depth — includes transitive dependencies
nestweaver context "UserService" --token-budget 4000

# Broad exploration — good for understanding a subsystem
nestweaver context "UserService" --token-budget 8000
```

You can also tune retrieval with `--intent` to weight different edge types:

```bash
nestweaver context "UserService" --intent "understand how payments are processed"
```

## Search by keyword

Find symbols and notes matching a keyword:

```bash
nestweaver search "authentication"
# Found N symbol(s) matching 'authentication':
```

For regex patterns across indexed text:

```bash
nestweaver regex-search "handle.*Request"
```

## Check impact before changing code

Before modifying a symbol, check its blast radius — the confidence-weighted set of symbols that depend on it:

```bash
nestweaver impact UserService
```

This traces downstream through the dependency graph, scoring each affected symbol by how directly it depends on the target. Use this to understand the scope of a change before making it.

## Query via MCP tools

When working through an AI agent (Claude Code, Cursor, Codex, etc.), NestWeaver exposes 40 MCP tools that provide the same capabilities programmatically. After running `nestweaver setup`, your AI tool can call tools like:

- **brain_context** — get task-focused context filtered by repo, tags, or path
- **brain_search** — full-text search across code and notes
- **brain_impact** — check blast radius before making changes
- **flow_trace** — trace execution flow through the call graph
- **read_symbols** — read a symbol's source span without opening the whole file
- **investigate** — orient on an unfamiliar topic in one call

The MCP server runs as a background daemon, enabling concurrent access from multiple AI tools without lock contention.

## Next steps

- [MCP Tools](/mcp-tools/) — full reference for all 40 tools
- [Token Efficiency](/guides/token-efficiency/) — strategies for keeping context lean
- [Configuration](/configuration/) — customize indexing behavior, edge weights, and more
