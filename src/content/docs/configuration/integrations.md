---
title: AI Tool Integrations
description: NestWeaver auto-configures 16 AI tools including Claude Code, Cursor, Aider, and Copilot with a single setup command.
sidebar:
  order: 3
---

NestWeaver integrates with 16 AI coding tools through a single `nestweaver setup` command. It auto-detects which tools are installed in your project directory and writes the appropriate MCP server configuration for each one, so every tool gets access to your codebase graph immediately.

## Supported tools

| Tool           | Config File                           | What Setup Writes                                                                                     |
| -------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Claude Code    | `.mcp.json`                           | MCP server config, skill file (`.claude/skills/nestweaver/SKILL.md`), hooks (`.claude/settings.json`) |
| Cursor         | `.cursor/mcp.json`                    | MCP server (lite mode: 6 tools), agent rules (`.cursor/rules/nestweaver.mdc`)                         |
| Codex          | `.codex/config.toml`                  | MCP server config, codebase guide (`AGENTS.md`)                                                       |
| Windsurf       | `~/.codeium/windsurf/mcp_config.json` | MCP server config                                                                                     |
| JetBrains      | `.junie/mcp/mcp.json`                 | MCP server config                                                                                     |
| VS Code        | `.vscode/mcp.json`                    | MCP server config                                                                                     |
| Gemini CLI     | `.gemini/settings.json`               | MCP server config                                                                                     |
| GitHub Copilot | `.github/copilot-mcp.json`            | MCP server config, instructions (`.github/copilot-instructions.md`)                                   |
| Aider          | `.aider.conf.yml`                     | Repo-map reference                                                                                    |
| Kiro           | `.kiro/settings.json`                 | MCP server config                                                                                     |
| Continue.dev   | `.continue/config.json`               | MCP server config                                                                                     |
| Cline          | `.cline/settings.json`                | MCP server config                                                                                     |
| OpenCode       | `.opencode/config.json`               | MCP server config                                                                                     |
| Trae           | `.trae/config.json`                   | MCP server config                                                                                     |
| Devin          | `devin.json`                          | MCP server config                                                                                     |
| Hermes         | `.hermes/config.json`                 | MCP server config                                                                                     |

## Running setup

```sh
# Auto-detect and configure all installed tools
nestweaver setup

# Configure a specific tool only
nestweaver setup --tool claude-code

# Force-regenerate customized files (skill, cursor rules, etc.)
nestweaver setup --force
```

Setup is safe to run repeatedly. It merges into existing config files without overwriting your other settings, and skips files that already have NestWeaver configured. Deprecated MCP arguments are automatically stripped on re-runs.

## What setup does

For most tools, setup writes a single MCP server entry into the tool's config file. The entry tells the tool how to launch the NestWeaver MCP server:

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

**Claude Code** gets additional setup beyond the MCP config:

- A **skill file** at `.claude/skills/nestweaver/SKILL.md` that teaches Claude Code how to use NestWeaver's tools effectively
- **Hooks** in `.claude/settings.json` — a `SessionStart` hook that prints brain status so the agent knows the graph is available, and a `PreToolUse` hook on Bash that suggests graph alternatives when the agent falls back to grep/find

**Cursor** gets lite mode by default (6 core tools instead of 40) to stay within Cursor's tool limits, plus an agent rules file at `.cursor/rules/nestweaver.mdc`.

**Codex** gets an `AGENTS.md` codebase guide alongside the MCP config in `.codex/config.toml`.

**GitHub Copilot** gets an instructions file at `.github/copilot-instructions.md`.

## Manual configuration

If you prefer to configure NestWeaver manually or need to customize the setup, add the MCP server entry to your tool's config file directly.

For any tool that uses JSON MCP config:

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

For Codex (TOML format):

```toml
[mcp_servers.nestweaver]
command = "nestweaver"
args = ["mcp", "--db", "/absolute/path/to/nestweaver.lbug"]
```

For Aider (YAML format):

```yaml
# NestWeaver code intelligence
repo-map: nestweaver mcp --db /absolute/path/to/nestweaver.lbug
```

## Lite mode

Cursor and other tools with low tool-count limits can use lite mode, which exposes 6 core tools instead of the full 40:

```sh
nestweaver mcp --lite --db ./nestweaver.lbug
```

Lite mode is automatically used when setup configures Cursor. You can also use it manually for any tool where you want a smaller surface area.

## Tool allowlist

For fine-grained control, pass `--tools` with a comma-separated list to expose only the specific tools you need:

```sh
nestweaver mcp --tools brain_context,read_symbols,blast_radius --db ./nestweaver.lbug
```

This is useful when you want more than lite mode's 6 tools but fewer than the full 40, or when you want to tailor the available tools to a specific workflow.

## Detection

Setup auto-detects tools by checking for their config directories and binaries:

| Tool           | Detection Method                                                                      |
| -------------- | ------------------------------------------------------------------------------------- |
| Claude Code    | `.claude/` directory or `claude` binary in PATH                                       |
| Cursor         | `.cursor/` directory                                                                  |
| Codex          | `codex` binary in PATH                                                                |
| Windsurf       | `~/.codeium/` directory                                                               |
| JetBrains      | `.idea/` or `.junie/` directory                                                       |
| VS Code        | `.vscode/` directory                                                                  |
| Gemini CLI     | `.gemini/` directory or `gemini` binary in PATH                                       |
| GitHub Copilot | `.github/copilot-mcp.json`, `.github/copilot-instructions.md`, or `gh` binary in PATH |
| Aider          | `.aider.conf.yml` or `aider` binary in PATH                                           |
| Kiro           | `.kiro/` directory or `kiro` binary in PATH                                           |
| Continue.dev   | `.continue/` directory                                                                |
| Cline          | `.cline/` directory                                                                   |
| OpenCode       | `.opencode/` directory or `opencode` binary in PATH                                   |
| Trae           | `.trae/` directory                                                                    |
| Devin          | `devin.json` or `devin` binary in PATH                                                |
| Hermes         | `.hermes/` directory or `hermes` binary in PATH                                       |

Use `--force` to configure all 16 tools regardless of detection, which is useful when setting up a shared repository before other team members have installed their tools.
