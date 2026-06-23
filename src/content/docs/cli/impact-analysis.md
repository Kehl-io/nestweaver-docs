---
title: Impact & Analysis
description: Analyze blast radius, find dead code, and assess change impact using NestWeaver's graph-powered CLI commands.
sidebar:
  order: 4
---

NestWeaver's analysis commands help you understand the consequences of changes before you make them. The `impact` command traces the blast radius of a symbol through the dependency graph with confidence-weighted scoring, while `pr-impact` analyzes an entire PR's changed files and assigns a risk level. These are structural analyses based on the graph — no LLM required.

## Command reference

| Command          | Description                          | Key Flags                                     |
| ---------------- | ------------------------------------ | --------------------------------------------- |
| `impact`         | Trace blast radius of a symbol       | `--depth`, `--confidence`, `--repo`, `--json` |
| `pr-impact`      | PR blast radius with risk scoring    | `--files`, `--depth`, `--json`                |
| `affected-tests` | Select tests for changed files       | `--files`, `--base-ref`, `--json`             |
| `dead-code`      | Detect unreachable symbols           | `--min-confidence`, `--json`                  |
| `hubs`           | Find most-connected hub nodes        | `--top`, `--json`, `--config`                 |
| `bridges`        | Find architectural chokepoints       | `--top`, `--json`, `--config`                 |
| `contracts`      | Inspect API contract graph           | (subcommand)                                  |
| `ranking`        | Inspect ranking priors               | `explain`, `rank` subcommands                 |
| `eval`           | Offline retrieval-quality evaluation | `run`, `compare` subcommands                  |
| `export`         | Export graph to external format      | `--format`, `--output`, `--top`               |
| `clusters`       | Detect community clusters            | `--resolution`, `--json`                      |

## Blast radius analysis

```bash
# Check what depends on a symbol
nestweaver impact "processPayment" --depth 5

# Filter to a specific repo in a multi-repo setup
nestweaver impact "processPayment" --repo payments-api --json

# Set minimum edge confidence threshold
nestweaver impact "processPayment" --confidence 0.8
```

`impact` traverses incoming CALLS, IMPORTS, EXTENDS, and IMPLEMENTS edges from the target symbol. Each affected symbol gets an `impact_score` that decays multiplicatively through edges — low-confidence paths are pruned automatically. The default depth is 3.

## PR impact analysis

```bash
# Auto-detect changed files from git diff
nestweaver pr-impact

# Specify files explicitly
nestweaver pr-impact --files src/auth.rs,src/db.rs

# Deeper analysis
nestweaver pr-impact --depth 5 --json
```

`pr-impact` maps changed files to their symbols, runs transitive impact analysis, groups results by cluster, and assigns a risk level: **Low**, **Medium**, **High**, or **Critical**. When no `--files` are given, it uses `git diff --name-only` to detect changes automatically.

## Test selection

```bash
# Select tests affected by specific file changes
nestweaver affected-tests --files src/auth.rs,src/db.rs

# Diff against a base branch
nestweaver affected-tests --base-ref main --json
```

`affected-tests` performs static, call-graph-based regression test selection. It maps changed files to symbols, reverse-traverses CALLS/IMPORTS to depth 3, and buckets dependent test files into priority tiers. This is a prioritized signal, not a provably safe subset — it misses reflection, DI, codegen, and data-driven tests.

## Dead code detection

```bash
# Find potentially dead code
nestweaver dead-code

# Only high-confidence results
nestweaver dead-code --min-confidence high --json
```

`dead-code` walks forward from every entry point following CALLS, IMPORTS, EXTENDS, IMPLEMENTS, and MEMBER_OF edges. Symbols not reached are reported as potentially dead, with confidence levels: `low`, `medium`, `high`. Entry points are determined from manifest files and visibility modifiers.

## Graph topology

```bash
# Find hub nodes (highest degree centrality + PageRank)
nestweaver hubs --top 20

# Find bridge/chokepoint nodes (highest betweenness centrality)
nestweaver bridges --top 20

# Detect community clusters (Leiden algorithm)
nestweaver clusters --resolution 0.5 --json
```

Hubs are central abstractions many parts of the codebase depend on. Bridges are architectural chokepoints — many shortest paths pass through them, so changing a bridge has outsized blast radius. Clusters use Leiden community detection; results are cached in a sidecar file.

## Graph export

```bash
# Export as Cypher (Neo4j)
nestweaver export --format cypher

# Export as GraphML (Gephi/yEd)
nestweaver export --format graphml --output graph.xml

# Export as Mermaid flowchart (top 30 symbols by PageRank)
nestweaver export --format mermaid --top 30

# Export as MessagePack (for WASM mode)
nestweaver export --format msgpack --output graph.msgpack
```

Supported formats: Cypher (Neo4j), GraphML (Gephi/yEd), Mermaid, MessagePack.
