---
title: AI Tool Integrations
description: NestWeaver auto-configures 16 AI tools including Claude Code, Cursor, Aider, and Copilot with a single setup command.
sidebar:
  order: 3
---

NestWeaver integrates with 16 AI coding tools through a single `nestweaver setup` command. It auto-detects which tools are installed in your project directory and writes the appropriate MCP server configuration for each one, so every tool gets access to your codebase graph immediately.

## Supported tools

| Tool           | Config File                            | What Setup Writes                                                                                                                        |
| -------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Claude Code    | `.mcp.json`                            | MCP server config, skill file (`.claude/skills/nestweaver/SKILL.md`), hooks (`.claude/settings.json`)                                    |
| Cursor         | `.cursor/mcp.json`                     | MCP server (lite mode: 6 tools), agent rules (`.cursor/rules/nestweaver.mdc`)                                                            |
| Codex          | `.codex/config.toml`                   | MCP server config, codebase guide (`AGENTS.md`)                                                                                          |
| Windsurf       | `~/.codeium/windsurf/mcp_config.json`  | MCP server config                                                                                                                        |
| JetBrains      | `.junie/mcp/mcp.json`                  | MCP server config                                                                                                                        |
| VS Code        | `.vscode/mcp.json`                     | MCP server config under the `servers` key                                                                                                |
| Gemini CLI     | `.gemini/settings.json`                | MCP server config                                                                                                                        |
| GitHub Copilot | `.vscode/mcp.json`                     | MCP server config under `servers`, instructions (`.github/copilot-instructions.md`)                                                      |
| Aider          | —                                      | Nothing: Aider has no MCP client. Setup removes the invalid `repo-map:` line older releases wrote                                        |
| Kiro           | `.kiro/settings/mcp.json`              | MCP server config                                                                                                                        |
| Continue.dev   | `.continue/mcpServers/nestweaver.json` | MCP server config                                                                                                                        |
| Cline          | —                                      | Nothing: setup prints the entry to add in Cline's MCP Servers panel                                                                      |
| OpenCode       | `opencode.json`                        | MCP server config under `mcp` (`"type": "local"`)                                                                                        |
| Trae           | `.trae/config.json`                    | MCP server config. Unverified: Trae's own docs do not name this file; check Trae's MCP settings                                          |
| Devin          | `devin.json`                           | MCP server config. Devin reads `.devin/mcp_config.json` instead, so add the entry there by hand                                          |
| Hermes         | `.hermes/config.json`                  | MCP server config. HermesAgent ignores this file; configure `~/.hermes/config.yaml` by hand ([HermesAgent](/integrations/hermes-agent/)) |

## Running setup

```sh
# Auto-detect and configure all installed tools
nestweaver setup

# Configure a specific tool only
nestweaver setup claude-code

# Force-regenerate customized files (skill, cursor rules, etc.)
nestweaver setup --force
```

Setup is safe to run repeatedly. It merges into existing config files without overwriting your other settings, and skips files that already have NestWeaver configured. Deprecated MCP arguments are automatically stripped on re-runs, and re-running setup repairs hooks written by older releases.

Setup attempts every selected tool and reports, per tool, each file it wrote (`✓`) or the tool that failed (`✗`, with the error and the files already written). It exits non-zero if any tool failed, including with `--all`. An existing entry that names a different database is reported and left alone; `--force` rebinds it to the new `--db`. Setup refuses to write through a symlinked directory that points outside the project.

## What setup does

For most tools, setup writes a single MCP server entry into the tool's config file. The entry tells the tool how to launch the NestWeaver MCP server:

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

Setup always writes the database as an absolute path, so a client launched from another directory still queries the same graph.

**Claude Code** gets additional setup beyond the MCP config:

- A **skill file** at `.claude/skills/nestweaver/SKILL.md` that teaches Claude Code how to use NestWeaver's tools effectively
- **Hooks** in `.claude/settings.json` — a `SessionStart` hook that prints brain status so the agent knows the graph is available, and a `PreToolUse` hook on Bash that adds a note to the agent's context suggesting `brain_search` or `brain_context` when it runs grep, rg, find or a similar search. The database path in the hook command is shell-quoted.

**Cursor** gets lite mode by default (6 core tools instead of 43) to stay within Cursor's tool limits, plus an agent rules file at `.cursor/rules/nestweaver.mdc`.

**Codex** gets an `AGENTS.md` codebase guide alongside the MCP config in `.codex/config.toml`.

**GitHub Copilot** gets an instructions file at `.github/copilot-instructions.md`. Copilot in VS Code reads its MCP servers from `.vscode/mcp.json`.

**Cline** keeps MCP servers in one user-level file and reads no project file, so setup writes nothing and prints the `mcpServers` entry to add through Cline's **MCP Servers > Configure** panel.

**Aider** has no MCP client. Use the `nestweaver` CLI from Aider's shell.

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

VS Code and Copilot use `servers` instead of `mcpServers` in `.vscode/mcp.json`, and name the transport with `"type": "stdio"`:

```json
{
  "servers": {
    "nestweaver": {
      "type": "stdio",
      "command": "nestweaver",
      "args": ["mcp", "--db", "/absolute/path/to/nestweaver.lbug"]
    }
  }
}
```

## Lite mode

Cursor and other tools with low tool-count limits can use lite mode, which exposes 6 core tools instead of the full 43:

```sh
nestweaver mcp --lite --db ./nestweaver.lbug
```

Lite mode is automatically used when setup configures Cursor. You can also use it manually for any tool where you want a smaller surface area.

## Tool allowlist

For fine-grained control, pass `--tools` with a comma-separated list to expose only the specific tools you need:

```sh
nestweaver mcp --tools brain_context,read_symbols,blast_radius --db ./nestweaver.lbug
```

This is useful when you want more than lite mode's 6 tools but fewer than the full 43, or when you want to tailor the available tools to a specific workflow.

## Detection

Setup auto-detects tools by checking for their config directories and binaries:

| Tool           | Detection Method                                                                               |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Claude Code    | `.claude/` directory or `claude` binary in PATH                                                |
| Cursor         | `.cursor/` directory                                                                           |
| Codex          | `codex` binary in PATH                                                                         |
| Windsurf       | `~/.codeium/` directory                                                                        |
| JetBrains      | `.idea/` or `.junie/` directory                                                                |
| VS Code        | `.vscode/` directory                                                                           |
| Gemini CLI     | `.gemini/` directory or `gemini` binary in PATH                                                |
| GitHub Copilot | `.github/copilot-mcp.json` (legacy), `.github/copilot-instructions.md`, or `gh` binary in PATH |
| Aider          | `.aider.conf.yml` or `aider` binary in PATH                                                    |
| Kiro           | `.kiro/` directory or `kiro` binary in PATH                                                    |
| Continue.dev   | `.continue/` directory                                                                         |
| Cline          | `.cline/` directory                                                                            |
| OpenCode       | `opencode.json`, `.opencode/` directory or `opencode` binary in PATH                           |
| Trae           | `.trae/` directory                                                                             |
| Devin          | `devin.json` or `devin` binary in PATH                                                         |
| Hermes         | `.hermes/` directory or `hermes` binary in PATH                                                |

Use `--all` to configure all 16 tools regardless of detection. `--force` overwrites customized skill and guide files and rebinds an entry that names a different `--db`; it never overwrites `.github/copilot-instructions.md` or an `AGENTS.md` without NestWeaver's generated-section markers. The tool name is positional: `nestweaver setup claude-code`.

## Verify after setup or an upgrade

Use the same absolute `--db` and usual `--config` bindings for indexing, setup and
queries. Reconnect the client and inspect tool discovery (43 full tools, six in
lite mode, or your explicit allowlist), then query `brain_status`, a known symbol
with `brain_search` and its caller with `brain_impact`. A written config or a
successful CLI command alone does not prove MCP activation. See the
[verification walkthrough](/integrations/verification/) and
[12.2.4 upgrade procedure](/guides/release-12-2-4/).

The package's `mcpName` and `server.json` prepare official MCP Registry identity;
installation does not create a registry listing. See the separate
[registry checklist](/guides/mcp-registry/).
