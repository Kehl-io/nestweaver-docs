---
title: HermesAgent
description: Connect NestWeaver to HermesAgent for structural code intelligence. MCP setup, tool naming, skills integration, and config reference.
sidebar:
  order: 4
---

HermesAgent is a self-improving, model-agnostic coding agent by Nous Research. It supports MCP natively — its client auto-discovers NestWeaver's 40 tools at startup and registers them in the agent's tool registry.

## Setup

### Option 1: Auto-setup (recommended)

```bash
nestweaver setup hermes
```

This writes a project-local `.hermes/config.json` with the NestWeaver MCP server entry, merged with any existing config.

### Option 2: HermesAgent native config

Edit `~/.hermes/config.yaml` and add NestWeaver under `mcp_servers`:

```yaml
mcp_servers:
  nestweaver:
    command: 'nestweaver'
    args: ['mcp', '--db', '/path/to/your.lbug']
    env:
      NESTWEAVER_DB: '/path/to/your.lbug'
    timeout: 30
    enabled: true
```

The `env` block is important — HermesAgent only passes explicitly declared environment variables to stdio subprocesses, not the full shell environment.

### Option 3: HermesAgent CLI

```bash
hermes mcp add nestweaver --command nestweaver --args '["mcp", "--db", "/path/to/your.lbug"]'
```

### Reload without restarting

If you're already in a HermesAgent session:

```
/reload-mcp
```

## Tool naming

HermesAgent auto-discovers tools and registers them with the prefix pattern:

```
mcp_nestweaver_<tool_name>
```

For example:

| NestWeaver tool | HermesAgent name               |
| --------------- | ------------------------------ |
| `brain_context` | `mcp_nestweaver_brain_context` |
| `brain_search`  | `mcp_nestweaver_brain_search`  |
| `read_symbols`  | `mcp_nestweaver_read_symbols`  |
| `blast_radius`  | `mcp_nestweaver_blast_radius`  |
| `flow_trace`    | `mcp_nestweaver_flow_trace`    |

All 40 tools follow this pattern. The agent calls them by their prefixed name — no manual mapping needed.

## Tool filtering

To limit which NestWeaver tools HermesAgent sees, use include/exclude lists:

```yaml
mcp_servers:
  nestweaver:
    command: 'nestweaver'
    args: ['mcp', '--db', '/path/to/your.lbug']
    tools:
      include:
        - brain_context
        - brain_search
        - read_symbols
        - blast_radius
        - flow_trace
      exclude: []
```

When `include` is set, only listed tools are registered. An empty `include` (the default) means all tools.

Alternatively, use NestWeaver's built-in lite mode:

```yaml
mcp_servers:
  nestweaver:
    command: 'nestweaver'
    args: ['mcp', '--lite', '--db', '/path/to/your.lbug']
```

You can also disable resource and prompt utilities if you don't need them:

```yaml
tools:
  prompts: false
  resources: false
```

## Skills integration

HermesAgent's skills system learns from experience — after completing complex tasks, it creates reusable skill files in `~/.hermes/skills/`. When the agent uses NestWeaver tools to solve a problem, it may generate skills that document effective NestWeaver query patterns.

For example, after a session where the agent uses `brain_context` with tag filtering to navigate a monorepo, it might create a skill documenting that workflow for future sessions.

Skills don't wrap MCP tools directly — they're procedural instructions the agent follows, and those instructions can reference any tool in its registry, including NestWeaver's `mcp_nestweaver_*` tools.

## What NestWeaver adds to HermesAgent

Without NestWeaver, HermesAgent navigates code using `ripgrep` and paginated file reads (capped at 100K characters per read). Each round-trip costs tokens — the LLM reasons about what to search, processes search results, reads files, then reasons again. With NestWeaver:

- **Single-call answers** — `brain_context` returns the relevant symbols ranked by structural importance, within a token budget. No grep → read → re-grep loops.
- **Symbol-level precision** — `read_symbols` returns a function's source span (~400 tokens) instead of the entire file (~8,000 tokens for a 2000-line file).
- **Structural queries** — "What calls this function?" answered from the graph in one call, not by reading 10+ files.
- **Persistent codebase memory** — The graph persists across sessions. Session 100 starts as fast as session 1.
- **Reduced context compression** — Less raw code means HermesAgent's middle-message summarization triggers less often and loses less information.

:::tip[Token efficiency]
Use `response_format: "concise"` on context queries when scanning many results — it returns titles and kinds only, cutting response tokens by ~60%. Switch to `"detailed"` only for results you need to read deeply.
:::

## Config reference

Full config options for the NestWeaver MCP server in HermesAgent:

```yaml
mcp_servers:
  nestweaver:
    command: 'nestweaver' # executable
    args: ['mcp', '--db', '/path/to.lbug'] # CLI arguments
    env: # environment variables
      NESTWEAVER_DB: '/path/to.lbug'
    timeout: 30 # tool call timeout (seconds)
    connect_timeout: 10 # startup timeout (seconds)
    enabled: true # set false to disable without removing
    supports_parallel_tool_calls: false # concurrent tool execution
    tools:
      include: [] # tool whitelist (empty = all)
      exclude: [] # tool blacklist
      prompts: true # enable prompt utilities
      resources: true # enable resource utilities
```

## Verify the connection

Start HermesAgent and check the tool registry:

```bash
hermes
```

At startup, you should see NestWeaver's tools registered as `mcp_nestweaver_*`. Ask the agent to query the graph:

```
What are the main entry points in this codebase?
```

The agent should use `mcp_nestweaver_brain_context` rather than falling back to `search_files` and `read_file`.
