---
title: Multi-Repo & Projects
description: Configure NestWeaver to work across multiple repositories with cross-repo references and named projects.
sidebar:
  order: 6
---

Projects group repositories, vault folders, and feature bundles into named units that scope queries to just the code that matters. NestWeaver detects cross-repo dependencies at three confidence layers — declared links in config, inferred links from shared symbols, and implicit links from vault structure — giving you a unified view across repository boundaries.

## Command reference

| Command                    | Description                                                          | Key Flags                                                                                     |
| -------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `list-projects`            | List all projects (declared and materialized)                        | `--json`, `--db`, `--config`                                                                  |
| `project-context`          | Get PPR-ranked context scoped to a project                           | `--token-budget`, `--include-components`, `--since`, `--recency-weight`, `--json`, `--config` |
| `materialize-projects`     | Materialize projects, wiki sources, and cross-repo links from config | `--config`, `--db`                                                                            |
| `detect-implicit-projects` | Detect implicit projects from vault structure                        | `--vault`, `--db`                                                                             |
| `suggest-links`            | Discover potential cross-repo links                                  | `--db`, `--json`, `--config`                                                                  |
| `list-links`               | List all declared cross-repo links                                   | `--config`, `--json`                                                                          |
| `list-features`            | List feature bundles from instance config                            | `--config`, `--json`                                                                          |
| `cross-repo-refs`          | Find references crossing repo boundaries                             | `--repo`, `--json`                                                                            |

## Defining projects

Projects are declared in `nestweaver-instance.toml`. Each project lists its repos and optional components (sub-projects). Once declared, use `materialize-projects` to create graph nodes for them.

```toml
# nestweaver-instance.toml
[[projects]]
name = "payments"
repos = ["payments-api", "payments-worker"]
components = ["checkout", "refunds"]
```

## Setting up a multi-repo project

Index multiple repositories into the same database, then materialize the project definitions from your config:

```bash
# Index multiple repos into the same database
nestweaver index --repo ./payments-api --name payments-api --db ./all.lbug
nestweaver index --repo ./payments-worker --name payments-worker --db ./all.lbug

# Materialize projects from config
nestweaver materialize-projects --config ./nestweaver-instance.toml --db ./all.lbug

# List projects
nestweaver list-projects --db ./all.lbug --json
```

## Project-scoped context

`project-context` returns all notes and symbols belonging to the project, ranked by PPR. The `--token-budget` flag (default 3000) controls output size. Use `--since` to hard-filter old notes, or `--recency-weight` for a soft age-decay boost.

```bash
# Get context for a project
nestweaver project-context payments --token-budget 5000

# Include component sub-projects
nestweaver project-context payments --include-components --json

# Filter to recently modified notes
nestweaver project-context payments --since 2026-01-01T00:00:00Z

# Apply recency bias to ranking
nestweaver project-context payments --recency-weight 0.5 --recency-half-life-days 14
```

## Cross-repo link detection

NestWeaver discovers cross-repo relationships at three confidence layers.

### Declared links (highest confidence)

Explicitly defined in the instance config. Use `list-links` to view them.

### Inferred links (medium confidence)

Discovered by analyzing shared symbols, imports, and naming patterns across repos. Use `suggest-links` to find them.

### Implicit links (lowest confidence)

Detected from vault structure, note references to code, and workspace organization. Use `detect-implicit-projects` to find them.

```bash
# Discover potential cross-repo links
nestweaver suggest-links --db ./all.lbug

# List declared links from config
nestweaver list-links --config ./nestweaver-instance.toml

# Find references crossing repo boundaries
nestweaver cross-repo-refs processPayment --json

# Detect implicit projects from vault structure
nestweaver detect-implicit-projects --vault ~/brain --db ./all.lbug
```

## Feature bundles

Features are cross-cutting concerns that span multiple repos and components. Declare them in the instance config and query them with `context --feature`.

```bash
# List declared features
nestweaver list-features --config ./nestweaver-instance.toml

# Get context scoped to a feature
nestweaver context --feature device-pairing --config ./nestweaver-instance.toml
```
