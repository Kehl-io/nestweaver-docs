---
title: Impact Analysis Tools
description: NestWeaver MCP tools for assessing blast radius, tracing dependencies, finding dead code, and analyzing architectural structure.
sidebar:
  order: 4
---

Impact analysis tools help agents assess what might break before making changes. They trace dependencies, score risk, identify dead code, and reveal architectural structure.

## blast_radius

Assess the full blast radius of file changes: maps files to symbols, traces reverse dependencies, groups by cluster, and returns a risk level (Low/Medium/High) with impact scores.

Use before merging a PR. For single-symbol impact, use `brain_impact`. For cross-repo impact, use `cross_repo_contracts`.

| Parameter       | Type       | Required | Description                                                                                            |
| --------------- | ---------- | -------- | ------------------------------------------------------------------------------------------------------ |
| `changed_files` | `string[]` | Yes      | List of changed file paths (repo-relative). Example: `["src/auth/login.ts", "src/utils/validate.ts"]`. |
| `max_depth`     | `integer`  | No       | Maximum transitive traversal depth. Default 3.                                                         |

## brain_impact

Trace reverse dependencies of a symbol to understand what might break if it changes. Returns confidence-weighted impact scores (0.0--1.0) decaying through the call graph.

Use before modifying a function, class, or interface. Results are sorted by `impact_score` (highest risk first).

| Parameter         | Type      | Required | Description                                                                                                                              |
| ----------------- | --------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `symbol`          | `string`  | Yes      | Symbol name (e.g. `"validateUser"`) or full UID. Names are resolved via first-match lookup.                                              |
| `depth`           | `integer` | No       | Max traversal depth. Default 3.                                                                                                          |
| `limit`           | `integer` | No       | Max impact nodes to return (default 50). Total count is always reported.                                                                 |
| `response_format` | `string`  | No       | `"concise"` returns affected symbol names only; `"detailed"` (default) adds file paths, edge types, confidence scores, and depth levels. |

## affected_tests

Prioritize which test files a PR should run by mapping changed files through the call/import graph to test files. Results are bucketed into priority tiers.

| Parameter       | Type       | Required | Description                                                                    |
| --------------- | ---------- | -------- | ------------------------------------------------------------------------------ |
| `changed_files` | `string[]` | No       | Changed file paths (repo-relative). Example: `["src/auth/login.ts"]`.          |
| `base_ref`      | `string`   | No       | Git ref to diff against (e.g. `"main"`). Used when `changed_files` is omitted. |

Provide either `changed_files` or `base_ref`. Tier 1 = directly references changed symbol, Tier 2 = direct caller, Tier 3 = transitive.

:::caution
Static call-graph regression test selection misses reflection, DI, codegen, and integration/e2e tests. "No tests found" does NOT mean safe to skip testing. Keep periodic full test runs in CI.
:::

## dead_code

Find potentially unreachable symbols by walking forward from all entry points (main, HTTP handlers, event listeners, test runners).

| Parameter         | Type     | Required | Description                                                                                                      |
| ----------------- | -------- | -------- | ---------------------------------------------------------------------------------------------------------------- |
| `min_confidence`  | `string` | No       | Minimum confidence: `"low"` (default, show all), `"medium"`, or `"high"` (strong candidates only).               |
| `response_format` | `string` | No       | `"concise"` returns name + confidence only; `"detailed"` (default) adds UIDs, file paths, kinds, and visibility. |

Confidence scoring: High = private/internal symbols, Medium = inferred visibility, Low = public/library API. Public symbols flagged as Low may be consumed by external code.

## detect_changes

Assess file-level blast radius for a set of changed files. Maps files to symbols, traces transitive dependents, and returns a risk assessment.

Use before committing or reviewing changes. For single-symbol impact, use `brain_impact`. For git diff details, use `brain_diff`.

| Parameter | Type       | Required | Description                                 |
| --------- | ---------- | -------- | ------------------------------------------- |
| `files`   | `string[]` | Yes      | List of changed file paths (repo-relative). |

Returns affected symbols, affected processes, and risk level (`low`, `medium`, `high`).

## hub_nodes

Identify the most connected symbols in the codebase ranked by total degree (incoming + outgoing edges). These are the architectural core.

| Parameter         | Type      | Required | Description                                                                                                                   |
| ----------------- | --------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `top_n`           | `integer` | No       | Number of top hubs to return. Default 10.                                                                                     |
| `response_format` | `string`  | No       | `"concise"` returns name + total degree only; `"detailed"` (default) adds UIDs, file paths, PageRank scores, and cluster IDs. |

Includes cluster membership when a clustering sidecar exists. For chokepoints between communities, use `bridge_nodes` instead.

## bridge_nodes

Find architectural chokepoints -- symbols with high betweenness centrality that sit on many shortest paths between other nodes.

| Parameter         | Type      | Required | Description                                                                                                                   |
| ----------------- | --------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `top_n`           | `integer` | No       | Number of top bridges to return. Default 10.                                                                                  |
| `response_format` | `string`  | No       | `"concise"` returns name + betweenness score only; `"detailed"` (default) adds UIDs, file paths, and connected community IDs. |

Betweenness is computed via Brandes' algorithm with sampling (approximate for large graphs). For most-connected nodes by degree, use `hub_nodes`.

## clusters

View the codebase's high-level architecture via Leiden community detection. Groups tightly-connected symbols into named functional clusters.

| Parameter    | Type     | Required | Description                                                                                                                                             |
| ------------ | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resolution` | `number` | No       | Leiden resolution parameter. Higher = more, smaller clusters; lower = fewer, larger clusters. Default 0.5 (0.3 for large graphs with over 10K symbols). |

Returns cluster name, cohesion score, key files, and up to 20 member symbols per cluster.

## cross_repo_contracts

Find cross-repository references to a symbol -- other repos that import, re-export, or implement the same symbol name.

| Parameter | Type      | Required | Description                                                                              |
| --------- | --------- | -------- | ---------------------------------------------------------------------------------------- |
| `uid`     | `string`  | No       | Symbol UID. Preferred for unambiguous lookup.                                            |
| `name`    | `string`  | No       | Symbol name (e.g. `"UserService"`). Uses first match if multiple symbols share the name. |
| `limit`   | `integer` | No       | Max contract links to return (default 50). Total count is always reported.               |

Provide either `uid` or `name`. Only useful when multiple repos are indexed in the same brain. Contract links are hypotheses -- check confidence scores before acting.

## contract_drift

Audit API contract drift: routes declared in specs (OpenAPI, `.proto`, GraphQL) but not implemented, and routes implemented but not declared in any spec.

| Parameter | Type      | Required | Description                                                            |
| --------- | --------- | -------- | ---------------------------------------------------------------------- |
| `repo`    | `string`  | No       | Optional repo UID to scope the analysis to a single repository.        |
| `limit`   | `integer` | No       | Max results per drift bucket (default 50). Totals are always reported. |

Returns two buckets: `declared_not_implemented` and `implemented_not_declared`. Contract links are hypotheses derived from spec parsing and handler heuristics.
