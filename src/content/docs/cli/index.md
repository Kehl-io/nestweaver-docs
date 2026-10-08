---
title: CLI Overview
description: NestWeaver CLI reference — index codebases, query the knowledge graph, analyze impact, and manage brain vaults from the command line.
sidebar:
  order: 1
---

The NestWeaver CLI is the primary interface for indexing codebases, querying the knowledge graph, and managing brain vaults. All commands route through a background daemon by default, enabling concurrent access from multiple AI tools without lock contention. The daemon auto-starts on first use and exits after 1 hour of inactivity.

## Global flags

These flags work on every command.

| Flag          | Short | Description                                                                    |
| ------------- | ----- | ------------------------------------------------------------------------------ |
| `--stats`     |       | Print timing and statistics after operations                                   |
| `--quiet`     | `-q`  | Suppress non-essential output                                                  |
| `--verbose`   | `-v`  | Show additional detail (e.g. UIDs)                                             |
| `--no-color`  |       | Disable colored output                                                         |
| `--plain`     |       | Alias for `--no-color`                                                         |

## Exit codes

| Code | Meaning |
| ---- | ------- |
| 0    | Success |
| 1    | The command failed |
| 2    | Target not found. Also: `stale-check` found drift, `pr-impact --strict` blocked, or `dead-code` refused |
| 3    | Ambiguous match |
| 4    | Unauthorized (`pull` only) |
| 5    | Unavailable (`pull` only) |
| 64   | Usage error (unknown flag, bad value) |

## Command groups

- [Indexing & Watch](/cli/indexing/) — Parse repos, live re-index, manage indexed sources
- [Context & Search](/cli/context-search/) — PPR-ranked context, full-text search, symbol lookup, regex search
- [Impact & Analysis](/cli/impact-analysis/) — Blast radius, PR impact, dead code, hubs, bridges, graph export
- [Brain Commands](/cli/brain/) — Vault management, unified search across code and notes
- [Multi-Repo & Projects](/cli/multi-repo/) — Cross-repo references, named projects, feature bundles

## Output formats

`--json` and `--no-embed` exist only on commands that declare them. `--db` is also per command (env: `NESTWEAVER_DB`, default `./nestweaver.lbug`). Human-readable output is the default when stdout is a terminal.

## Getting help

```bash
nestweaver --help
```

List all available commands. For details on any specific command:

```bash
nestweaver <command> --help
```
