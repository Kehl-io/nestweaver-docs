---
title: Quick Start
description: Index your first codebase and start querying in under a minute.
sidebar:
  order: 2
---

NestWeaver parses 32 languages via Tree-sitter — JS, TS, Go, Python, Rust, Java, C/C++, Lua, Scala, Elixir, Zig, Vue, Svelte, and more — and exposes 40 MCP tools for AI agents. Here's how to go from install to your first query.

## Set up your AI tools

NestWeaver integrates with 16 AI tools out of the box. Run `setup` to auto-configure them:

```bash
nestweaver setup
# NestWeaver Setup
# ────────────────────────────────────────
# ✓ Claude Code — .claude/settings.json — MCP server configured
# ✓ Cursor — .cursor/mcp.json — MCP server (lite: 6 tools)
# ...
```

This writes the correct MCP server configuration for each detected tool (Claude Code, Cursor, Codex, Gemini CLI, Copilot CLI, Aider, Kiro, and more). Run `nestweaver setup --force` to regenerate files even if you've customized them.

## Index your codebase

Point NestWeaver at a repository to build the knowledge graph:

```bash
nestweaver index --repo .
# Indexing /path/to/repo → ./nestweaver.lbug
```

NestWeaver auto-detects the repo root from `.git`, parses every supported file, resolves cross-file references with confidence scoring, and writes everything to a local database.

To include git history analysis (co-change mining and recency scoring):

```bash
nestweaver index --repo . --with-git-activity
```

## Start querying

Ask structural questions about your code:

```bash
nestweaver context processPayment
```

This uses Personalized PageRank to surface the symbols most relevant to your query — call sites, dependencies, type definitions, and more — without reading raw source files.

Search across symbols and notes:

```bash
nestweaver search "main"
# Found N symbol(s) matching 'main':
```

## Watch for changes

Keep the index up to date as you code:

```bash
nestweaver watch
```

This watches the filesystem and re-indexes on changes with debouncing, so your AI tools always have a current graph.

## Next steps

- [Your First Query](/getting-started/first-query/) — a deeper walkthrough of querying the graph
- [MCP Tools](/mcp-tools/) — the full list of 40 tools available to AI agents
- [Configuration](/configuration/) — customize indexing, token budgets, and more
