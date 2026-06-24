---
title: Integrations Overview
description: Connect NestWeaver to your AI tools. One-command setup for 16 agents including Claude Code, HermesAgent, Cursor, Devin, and more.
sidebar:
  order: 1
---

NestWeaver integrates with any AI tool that supports the Model Context Protocol (MCP). Run `nestweaver setup` to auto-configure supported tools, or add NestWeaver as an MCP server manually.

## One-command setup

```bash
nestweaver setup
```

This auto-detects installed AI tools and writes the MCP server configuration for each one. It currently supports 16 tools:

| Tool                                       | Config Path                           | Notes                                           |
| ------------------------------------------ | ------------------------------------- | ----------------------------------------------- |
| [Claude Code](/integrations/claude-code/)  | `.mcp.json` + `.claude/settings.json` | Deepest integration — includes enrichment hooks |
| [HermesAgent](/integrations/hermes-agent/) | `.hermes/config.json`                 | Auto-discovers tools as `mcp_nestweaver_*`      |
| Cursor                                     | `.cursor/mcp.json`                    | Use `--lite` for 6-tool mode                    |
| Codex                                      | `.codex/config.toml`                  |                                                 |
| Windsurf                                   | `~/.codeium/windsurf/mcp_config.json` | Global config                                   |
| JetBrains                                  | `.junie/mcp/mcp.json`                 |                                                 |
| VS Code                                    | `.vscode/mcp.json`                    |                                                 |
| Gemini CLI                                 | `.gemini/settings.json`               |                                                 |
| GitHub Copilot CLI                         | `.github/copilot-mcp.json`            |                                                 |
| Aider                                      | `.aider.conf.yml`                     | YAML config at project root                     |
| Kiro                                       | `.kiro/settings.json`                 |                                                 |
| Continue.dev                               | `.continue/config.json`               |                                                 |
| Cline                                      | `.cline/settings.json`                |                                                 |
| OpenCode                                   | `.opencode/config.json`               |                                                 |
| Trae                                       | `.trae/config.json`                   |                                                 |
| Devin                                      | `devin.json`                          |                                                 |

### Tools not covered by setup

Some MCP-compatible tools require manual configuration:

- **[OpenClaw](/integrations/openclaw/)** — Configure via `openclaw mcp add` CLI or edit `~/.openclaw/openclaw.json` directly

## Manual configuration

For any MCP-compatible tool not listed above, add NestWeaver as a stdio MCP server. The command is:

```bash
nestweaver mcp --db /path/to/your.lbug
```

Most tools use a JSON config like:

```json
{
  "command": "nestweaver",
  "args": ["mcp", "--db", "/path/to/your.lbug"]
}
```

The exact config format varies by tool — see the individual integration guides for details.

## Tool filtering

NestWeaver exposes 40 MCP tools by default. If your tool has limited tool slots or you want a focused set:

**Lite mode** — 6 core tools:

```bash
nestweaver mcp --lite --db /path/to/your.lbug
```

The 6 lite-mode tools are: `brain_context`, `brain_search`, `brain_impact`, `brain_status`, `brain_guide`, and `detect_changes`.

**Allowlist** — specific tools by name:

```bash
nestweaver mcp --tools brain_context,brain_search,read_symbols,blast_radius --db /path/to/your.lbug
```

**Additional MCP flags:**

| Flag                   | Description                                                             |
| ---------------------- | ----------------------------------------------------------------------- |
| `--lite`               | Expose only the 6 core tools                                            |
| `--tools <list>`       | Comma-separated allowlist of tool names                                 |
| `--track-interactions` | Enable usage-based ranking (learns from query patterns over time)       |
| `--config <path>`      | Load instance config for `[limits]`, `[response]`, `[ranking]` settings |

:::tip[Token efficiency]
Each MCP tool's schema loads into the agent's context window. If your agent connects to multiple MCP servers, using `--lite` or `--tools` reduces schema overhead. The 6 lite-mode tools cover most common queries.
:::

## Guide generation

NestWeaver can generate agent instruction files tailored to your codebase:

```bash
nestweaver generate-guide --format markdown --db ./your.lbug --output ./guide.md
nestweaver generate-guide --format claude-md --db ./your.lbug --output ./CLAUDE.md
nestweaver generate-guide --format cursor-rule --db ./your.lbug
nestweaver generate-guide --format agents-md --db ./your.lbug
nestweaver generate-guide --format skill --db ./your.lbug
```

Available formats: `markdown` (default), `claude-md`, `cursor-rule`, `agents-md`, `skill`.

These files give the agent a head start — architecture overview, key entry points, and conventions derived from the graph.
