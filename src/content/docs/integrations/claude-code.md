---
title: Claude Code
description: Set up NestWeaver with Claude Code — MCP tools, enrichment hooks, skill files, and optimal workflows for token-efficient coding.
sidebar:
  order: 2
---

Claude Code has the deepest NestWeaver integration. Beyond the standard MCP tools, it includes enrichment hooks that automatically surface graph context when you read files, run searches, or commit code.

## Quick setup

```bash
nestweaver setup claude-code
```

This writes three artifacts to your project:

1. **`.mcp.json`** — MCP server entry (merged with existing config, won't overwrite other servers)
2. **`.claude/settings.json`** — Enrichment hooks
3. **`.claude/skills/nestweaver/SKILL.md`** — Agent skill file

## What gets configured

### MCP server (`.mcp.json`)

```json
{
  "mcpServers": {
    "nestweaver": {
      "command": "nestweaver",
      "args": ["mcp", "--db", "./nestweaver.lbug"]
    }
  }
}
```

This gives Claude Code access to all 40 NestWeaver MCP tools — context retrieval, code navigation, impact analysis, and vault queries.

### Enrichment hooks (`.claude/settings.json`)

The setup command installs two hooks:

**SessionStart** — Prints brain status so the agent knows the graph is available:

```bash
nestweaver brain status --db ./nestweaver.lbug 2>/dev/null || echo 'NestWeaver: not indexed yet (run: nestweaver index --repo .)'
```

**PreToolUse (Bash)** — When the agent runs `grep`, `rg`, `find`, or similar search commands, returns context nudging toward `brain_search` or `brain_context` instead. Non-blocking — the original command still runs.

### Advanced hooks

The NestWeaver repo includes additional hooks you can install manually from `integrations/claude-code/hooks/`:

| Hook                         | Trigger                 | What it does                                                                                            |
| ---------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `pre-read-enrich.sh`         | PreToolUse (Read)       | Searches the graph for symbols in the file being read, shows the top 5 with locations                   |
| `post-edit-impact.sh`        | PreToolUse (Write/Edit) | Runs `nestweaver impact` on symbols about to be edited, shows top 3 affected dependents before the edit |
| `pre-search-enrich.sh`       | PreToolUse (Bash)       | Runs `nestweaver search` alongside grep to show graph results                                           |
| `post-commit-stale-check.sh` | PostToolUse (Bash)      | After `git commit`, compares HEAD against the indexed SHA and warns if the index is behind              |

All hooks read from stdin, use `$NESTWEAVER_DB` (default `./nestweaver.lbug`), and exit silently if the database doesn't exist.

## Recommended workflow

Use MCP tools and CLI in different contexts for optimal token efficiency:

| Context           | Interface                                                       | Why                                                   |
| ----------------- | --------------------------------------------------------------- | ----------------------------------------------------- |
| Main conversation | MCP tools (`brain_context`, `brain_search`, etc.)               | Natural tool-calling interface, schema already loaded |
| Subagents         | CLI via Bash (`nestweaver context`, `nestweaver search --json`) | ~40-60% fewer tokens — no tool schema overhead        |
| Hooks/scripts     | CLI with `--json`                                               | Machine-readable output, no schema cost               |

:::tip[Token efficiency]
In subagents, always use the CLI: `nestweaver context "UserService" --token-budget 2000 --json`. The CLI returns the same data as the MCP tools but without loading 40 tool schemas into the subagent's context window.
:::

## Tool filtering

If you want Claude Code to see fewer NestWeaver tools:

**Lite mode (6 core tools):**

```json
{
  "mcpServers": {
    "nestweaver": {
      "command": "nestweaver",
      "args": ["mcp", "--lite", "--db", "./nestweaver.lbug"]
    }
  }
}
```

**Specific tools only:**

```json
{
  "mcpServers": {
    "nestweaver": {
      "command": "nestweaver",
      "args": [
        "mcp",
        "--tools",
        "brain_context,brain_search,read_symbols,blast_radius",
        "--db",
        "./nestweaver.lbug"
      ]
    }
  }
}
```

## Generate a CLAUDE.md

NestWeaver can generate a `CLAUDE.md` file tailored to your codebase — architecture overview, key entry points, and conventions derived from the graph:

```bash
nestweaver generate-guide --format claude-md --db ./nestweaver.lbug --output ./CLAUDE.md
```

Use `--config` to enrich the guide with features and cross-repo links from an instance config:

```bash
nestweaver generate-guide --format claude-md --config ./nestweaver-instance.toml --db ./nestweaver.lbug
```

## Verify the integration

After setup, start a Claude Code session in your project directory. You should see NestWeaver's brain status printed at session start. Then ask the agent to query the graph:

```
What are the main entry points in this codebase?
```

The agent should use `brain_context` or `brain_search` rather than reading files directly.
