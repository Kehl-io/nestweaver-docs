---
title: Context & Search
description: Query NestWeaver's knowledge graph for ranked context and full-text search results from the CLI.
sidebar:
  order: 3
---

These commands retrieve information from the NestWeaver knowledge graph. The `context` command is the workhorse — it runs Personalized PageRank seeded from your query to surface structurally relevant symbols, ranked by importance. For targeted reading, `read-symbols` returns just a symbol's source span without reading the whole file.

## Command reference

| Command          | Description                             | Key Flags                                                                  |
| ---------------- | --------------------------------------- | -------------------------------------------------------------------------- |
| `context`        | PPR-ranked context around seed symbols  | `--intent`, `--limit`, `--token-budget`, `--feature`, `--config`, `--json` |
| `search`         | Full-text search across indexed symbols | `--limit`, `--json`, `--config`                                            |
| `symbol`         | Look up a symbol by name or UID         | `--instance`, `--json`                                                     |
| `read-symbols`   | Read a symbol's source span             | `--neighbors`, `--token-budget`, `--root`, `--json`                        |
| `regex-search`   | Regex search over indexed text          | `--path-prefix`, `--kinds`, `--limit`, `--max-millis`, `--json`            |
| `count-patterns` | Count regex matches per pattern         | `--path-prefix`, `--kinds`, `--json`                                       |
| `investigate`    | Orient on a topic in one call           | `--scope`, `--token-budget`, `--root`, `--json`                            |
| `repo-map`       | Token-budgeted structural skeleton      | `--token-budget`, `--json`                                                 |
| `summary`        | Hierarchical code summaries             | `--level`, `--token-budget`, `--target`, `--json`                          |

## Context retrieval

The `context` command is the primary way to pull ranked, relevant information from the graph. Seed it with symbol names, file paths, or both — NestWeaver resolves them to graph nodes and walks outward using Personalized PageRank.

```bash
# Get context for a symbol
nestweaver context processPayment

# Multiple seeds
nestweaver context processPayment CheckoutService

# Seed from a file path
nestweaver context src/checkout/payment.ts

# With intent tuning
nestweaver context processPayment --intent analyze-impact

# With token budget for LLM context windows
nestweaver context processPayment --token-budget 4000

# Feature-scoped context (requires instance config)
nestweaver context --feature device-pairing --config ./instance.toml
```

### Intent tuning

The `--intent` flag adjusts the PPR damping factor and edge-type weights to bias results toward different goals:

- **`find-definition`** — favors definition edges; surfaces where a symbol is declared.
- **`understand-architecture`** — favors module and containment edges; surfaces structural context.
- **`analyze-impact`** — favors call and dependency edges; surfaces what a change would affect.
- **`general-context`** — balanced weights across all edge types (default).

### Token budget vs. limit

`--token-budget` takes precedence over `--limit`. When set, NestWeaver truncates the output to fit an approximate token count (estimated as characters / 4). Use `--token-budget` when feeding results into an LLM context window; use `--limit` when you just want a fixed number of results.

## Search

Full-text search across all indexed symbols. Returns matches ranked by BM25 relevance.

```bash
# Search by name substring
nestweaver search "UserService"

# With result limit
nestweaver search "process" --limit 20 --json
```

## Symbol lookup

Look up a specific symbol by name or UID. Useful for disambiguation and quick inspection.

```bash
# Look up a symbol
nestweaver symbol processPayment

# Disambiguate with UID
nestweaver symbol "sym:repo:...:abc:42"
```

Exit codes: `0` = found, `2` = not found, `3` = ambiguous (multiple matches — prints candidates with their UIDs so you can re-query with the exact one).

## Reading source

:::tip[Token efficiency]
Use `read-symbols` instead of reading whole files. It returns only the symbol's source span (start_line..end_line), optionally with adjacent symbols via `--neighbors`. This can save 80-90% of tokens compared to reading the full file.
:::

```bash
# Read a symbol's source
nestweaver read-symbols processPayment

# Include 1 adjacent symbol for surrounding context
nestweaver read-symbols processPayment --neighbors 1

# Budget-aware reading
nestweaver read-symbols processPayment CheckoutService --token-budget 4000
```

## Regex search

Search indexed text with regular expressions. `count-patterns` is the counting counterpart — it returns match counts per pattern without bodies.

```bash
# Regex over indexed text
nestweaver regex-search 'fn\s+authenticate'

# Restrict to a path prefix and kind
nestweaver regex-search '(?i)todo' --path-prefix src/ --kinds Symbol --limit 20

# Count matches without returning bodies
nestweaver count-patterns 'TODO' 'FIXME' --path-prefix src/
```

## Investigation

The `investigate` command orients you on a topic in a single call. It runs hybrid retrieval (PPR + BM25 + pseudo-relevance feedback), groups results into architectural domains, inlines high-confidence symbol bodies, and persists a bundle with a 24-hour TTL. Use `investigate-expand` and `investigate-hydrate` to drill into specific domains or hydrate additional symbols from the bundle.

```bash
# Orient on a topic — architectural map + bundle_id
nestweaver investigate "device pairing"

# Scoped to a repo with a larger budget
nestweaver investigate "how indexing works" --scope repo:nestweaver --token-budget 8000
```

## Repo map and summaries

`repo-map` produces a token-budgeted structural skeleton of the codebase, ranked by PageRank so the most connected symbols appear first. `summary` generates hierarchical summaries at different granularity levels.

```bash
# Structural skeleton ranked by PageRank
nestweaver repo-map --token-budget 2000

# File-level summaries
nestweaver summary --level file --json

# Cluster-level architecture summary
nestweaver summary --level cluster --token-budget 2000
```

Summary levels:

- **`symbol`** — function and class details: signatures, parameters, return types.
- **`file`** — exports and imports per file.
- **`cluster`** — community-level architecture: what each detected module cluster does and how clusters relate.

Summaries are deterministic and derived from graph data — no LLM is involved.
