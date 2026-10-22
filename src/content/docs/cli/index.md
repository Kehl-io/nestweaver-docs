---
title: CLI Overview
description: NestWeaver CLI reference — index codebases, query the knowledge graph, analyze impact, and manage brain vaults from the command line.
sidebar:
  order: 1
---

The NestWeaver CLI is the primary interface for indexing codebases, querying the knowledge graph, and managing brain vaults. All commands route through a background daemon by default, enabling concurrent access from multiple AI tools without lock contention. The daemon auto-starts on first use. An explicitly started daemon (`nestweaver daemon start`) exits after 1 hour of inactivity (`--idle-timeout`, default 3600 seconds). An autostarted daemon for a database that looks temporary (under `/tmp`, `$TMPDIR` or `/var/folders`) exits after 60 seconds instead (`NESTWEAVER_EPHEMERAL_IDLE_TIMEOUT_SECS`); set `NESTWEAVER_REAL_DB_UNDER_TEMP_ROOT=1` when a long-lived database lives under one of those paths.

## Global flags

These flags work on every command.

| Flag         | Short | Description                                  |
| ------------ | ----- | -------------------------------------------- |
| `--stats`    |       | Print timing and statistics after operations |
| `--quiet`    | `-q`  | Suppress non-essential output                |
| `--verbose`  | `-v`  | Show additional detail (e.g. UIDs)           |
| `--no-color` |       | Disable colored output                       |
| `--plain`    |       | Alias for `--no-color`                       |

## Exit codes

| Code | Meaning                                                                                                                                                                                                                                                                            |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | Success                                                                                                                                                                                                                                                                            |
| 1    | The command failed                                                                                                                                                                                                                                                                 |
| 2    | Target not found. Also: `stale-check` found drift, `pr-impact --strict` blocked, or `dead-code` refused                                                                                                                                                                            |
| 3    | Ambiguous match                                                                                                                                                                                                                                                                    |
| 4    | Unauthorized (`pull` only)                                                                                                                                                                                                                                                         |
| 5    | Unavailable (`pull` only)                                                                                                                                                                                                                                                          |
| 64   | Usage error: an unknown flag, an out-of-range or empty value, a missing argument, or a value a tool's schema rejects. Examples: `affected-tests --files` without `--repo` when several repos are indexed, `pre-push-impact --format <invalid>`, `list-features` without `--config` |
| 69   | `daemon status` only: the daemon is running but unhealthy (unreachable, or its owner or endpoint cannot be verified)                                                                                                                                                               |
| 75   | Incomplete: `count-patterns` ran out of its time budget, so the counts it printed are lower bounds. Raise `--max-millis`                                                                                                                                                           |

With `--json`, a not-found exit 2 writes `{"error": "not found", ...}` to stdout on the read commands. An exit 64 raised by the argument parser happens before `--json` is read, so it writes only to stderr.

## Command groups

- [Indexing & Watch](/cli/indexing/) — Parse repos, live re-index, manage indexed sources
- [Context & Search](/cli/context-search/) — PPR-ranked context, full-text search, symbol lookup, regex search
- [Impact & Analysis](/cli/impact-analysis/) — Blast radius, PR impact, dead code, hubs, bridges, graph export
- [Brain Commands](/cli/brain/) — Vault management, unified search across code and notes
- [Multi-Repo & Projects](/cli/multi-repo/) — Cross-repo references, named projects, feature bundles

## Output formats

`--json` and `--no-embed` exist only on commands that declare them. `--db` is also per command (env: `NESTWEAVER_DB`, default `./nestweaver.lbug`). Human-readable output is the default when stdout is a terminal.

Relative `--db`, `--config` and repo paths are resolved against your current directory before the CLI sends them to the daemon, so a command run from any directory reads the files you named. When stdout is a terminal, control characters that come from indexed content (file names, symbol names, note text) are escaped; piped output is unchanged. Log lines respect `--no-color`, `NO_COLOR` and a non-terminal stderr.

## Getting help

```bash
nestweaver --help
```

List all available commands. For details on any specific command:

```bash
nestweaver <command> --help
```
