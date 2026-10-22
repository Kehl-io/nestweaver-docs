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
      "args": ["mcp", "--db", "/absolute/path/to/nestweaver.lbug"]
    }
  }
}
```

Setup writes the database as an absolute path, so the server finds the same graph however Claude Code is launched. If `.mcp.json` already names a different database, setup reports it and leaves it alone; `nestweaver setup claude-code --force` rebinds it.

This gives Claude Code access to all 43 NestWeaver MCP tools — context retrieval, code navigation, impact analysis, and vault queries.

### Enrichment hooks (`.claude/settings.json`)

The setup command installs two hooks:

**SessionStart** — Prints brain status so the agent knows the graph is available:

```bash
nestweaver brain status --db '/absolute/path/to/nestweaver.lbug' 2>/dev/null || echo 'NestWeaver: not indexed yet (run: nestweaver index --repo .)'
```

The database path is shell-quoted, so a path with spaces or shell metacharacters is passed through intact.

**PreToolUse (Bash)** — When the agent runs `grep`, `rg`, `find`, `fd`, `ack` or `ag`, the hook reads the command from the event's `tool_input` and adds a note to the agent's context (`hookSpecificOutput.additionalContext`) suggesting `brain_search`, `regex_search` or `brain_context` instead. Non-blocking — the original command still runs. It works without `jq` by matching the raw event text.

Setup in releases up to 12.2.1 wrote a Bash hook that read the wrong keys and never fired. Run `nestweaver setup claude-code` again to replace them.

### Advanced hooks

The NestWeaver repo includes additional hooks you can install manually from `integrations/claude-code/hooks/`. Copy the scripts to `.claude/hooks/nestweaver/` in your project and merge `integrations/claude-code/settings.json` into your `.claude/settings.json`; its commands run the scripts from `$CLAUDE_PROJECT_DIR/.claude/hooks/nestweaver/`. MCP servers belong in `.mcp.json`, not in `settings.json`.

| Hook                         | Trigger                 | What it does                                                                                            |
| ---------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `pre-read-enrich.sh`         | PreToolUse (Read)       | Searches the graph for symbols in the file being read, shows the top 5 with locations                   |
| `post-edit-impact.sh`        | PreToolUse (Write/Edit) | Runs `nestweaver impact` on symbols about to be edited, shows top 3 affected dependents before the edit |
| `pre-search-enrich.sh`       | PreToolUse (Bash)       | Runs `nestweaver search` alongside grep to show graph results                                           |
| `post-commit-stale-check.sh` | PostToolUse (Bash)      | After `git commit`, compares HEAD against the indexed SHA and warns if the index is behind              |

All hooks read the Claude Code event from stdin (`tool_input.file_path` or `tool_input.command`), return their context as `hookSpecificOutput.additionalContext` on stdout, use `$NESTWEAVER_DB` (default `nestweaver.lbug` in the project directory), and exit silently if `jq` is missing or the database doesn't exist. They never block a tool call.

## Recommended workflow

Use MCP tools and CLI in different contexts for optimal token efficiency:

| Context           | Interface                                                       | Why                                                   |
| ----------------- | --------------------------------------------------------------- | ----------------------------------------------------- |
| Main conversation | MCP tools (`brain_context`, `brain_search`, etc.)               | Natural tool-calling interface, schema already loaded |
| Subagents         | CLI via Bash (`nestweaver context`, `nestweaver search --json`) | ~40-60% fewer tokens — no tool schema overhead        |
| Hooks/scripts     | CLI with `--json`                                               | Machine-readable output, no schema cost               |

:::tip[Token efficiency]
In subagents, always use the CLI: `nestweaver context UserService --token-budget 2000 --json`. The CLI returns the same data as the MCP tools but without loading 43 tool schemas into the subagent's context window.
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

`--output` creates the file with `<!-- nestweaver:begin -->` / `<!-- nestweaver:end -->` markers when it is missing, and afterwards replaces only the text between them. It refuses, and leaves the file unchanged, when an existing file has no markers or more than one pair, so add the markers to a hand-written `CLAUDE.md` first.

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
