---
title: OpenClaw
description: Connect NestWeaver to OpenClaw for structural code intelligence across 22+ messaging platforms. MCP setup, tool filtering, and diagnostics.
sidebar:
  order: 3
---

OpenClaw is a local-first AI assistant that connects to 22+ messaging platforms and routes conversations through configurable LLM backends. It supports MCP natively — adding NestWeaver gives every conversation structural code intelligence without reading raw files.

## Setup

### Option 1: CLI (recommended)

```bash
openclaw mcp add nestweaver \
  --command nestweaver \
  --arg mcp \
  --arg --db \
  --arg /path/to/your.lbug
```

OpenClaw probes the server on save to verify the connection. Use `--no-probe` if NestWeaver isn't running yet.

### Option 2: Direct JSON

```bash
openclaw mcp set nestweaver '{"command":"nestweaver","args":["mcp","--db","/path/to/your.lbug"]}'
```

### Option 3: Edit config file

Add to `~/.openclaw/openclaw.json` under `mcp.servers`:

```json
{
  "mcp": {
    "servers": {
      "nestweaver": {
        "command": "nestweaver",
        "args": ["mcp", "--db", "/path/to/your.lbug"]
      }
    }
  }
}
```

### Option 4: Control UI

If the OpenClaw gateway is running, open `http://localhost:18789/mcp` in your browser and add the server through the UI.

## Verify the connection

```bash
openclaw mcp doctor nestweaver --probe
```

This runs a static config check and a live connection test. To list all discovered tools:

```bash
openclaw mcp probe nestweaver --json
```

## Tool filtering

NestWeaver exposes 40 tools by default. To limit which tools OpenClaw sees:

```bash
openclaw mcp tools nestweaver --include 'brain_context,brain_search,read_symbols,blast_radius,brain_impact'
```

Or exclude specific tools:

```bash
openclaw mcp tools nestweaver --exclude 'prune_stale,set_extension'
```

Clear filters to restore all tools:

```bash
openclaw mcp tools nestweaver --clear
```

You can also set filters in the config JSON:

```json
{
  "nestweaver": {
    "command": "nestweaver",
    "args": ["mcp", "--db", "/path/to/your.lbug"],
    "toolFilter": {
      "include": ["brain_context", "brain_search", "read_symbols", "blast_radius"],
      "exclude": []
    }
  }
}
```

Alternatively, use NestWeaver's built-in lite mode for a minimal 6-tool set:

```json
{
  "nestweaver": {
    "command": "nestweaver",
    "args": ["mcp", "--lite", "--db", "/path/to/your.lbug"]
  }
}
```

## What NestWeaver adds to OpenClaw

Without NestWeaver, OpenClaw navigates code using `grep` and file reads — multiple round-trips to find relevant symbols, each consuming tokens and context window space. With NestWeaver:

- **Single-call context retrieval** — `brain_context` returns ranked, token-budget-aware results instead of grep-then-read chains
- **Structural queries** — "What calls this function?" and "What's the blast radius?" answered from the graph, not by reading 10+ files
- **Persistent codebase memory** — The graph persists across sessions. No re-discovering project structure every conversation.
- **Reduced compaction** — Less raw code loaded into context means OpenClaw's context compaction triggers less often and loses less information

:::tip[Token efficiency]
Set a `token_budget` on context queries to control exactly how much context NestWeaver returns. Start with 2000–3000 tokens for focused tasks, increase to 8000+ for broad architectural questions.
:::

## Diagnostics

```bash
openclaw mcp list                     # List all configured servers
openclaw mcp show nestweaver --json   # Show server config
openclaw mcp status --verbose         # All servers with transport details
openclaw mcp reload                   # Dispose cached MCP runtimes
```

## Temporarily disable

To keep the config but skip NestWeaver at startup:

```json
{
  "nestweaver": {
    "command": "nestweaver",
    "args": ["mcp", "--db", "/path/to/your.lbug"],
    "enabled": false
  }
}
```
