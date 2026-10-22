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

| Parameter            | Type       | Required | Description                                                                                                                  |
| -------------------- | ---------- | -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `changed_files`      | `string[]` | No       | Changed file paths (repo-relative), at most 1000. Example: `["src/auth/login.ts", "src/utils/validate.ts"]`. Alias: `files`. |
| `repo`               | `string`   | No       | Repo name or UID that the changed paths belong to.                                                                           |
| `max_depth`          | `integer`  | No       | Maximum transitive traversal depth, 1--15. Default 3.                                                                        |
| `limit`              | `integer`  | No       | Max affected symbols to return, 1--1000.                                                                                     |
| `include_data_edges` | `boolean`  | No       | Also follow data (access) edges. Default `false`.                                                                            |
| `format`             | `string`   | No       | `"json"` (default) or `"sarif"`.                                                                                             |

Pass `changed_files` or its alias `files`, not both with different values. A changed file that is only top-level code is reported with a `changed-file-top-level-only` warning, and its callees are listed apart in `top_level_callees`.

## brain_impact

Trace reverse dependencies of a symbol to understand what might break if it changes. Returns confidence-weighted impact scores (0.0--1.0) decaying through the call graph.

Use before modifying a function, class, or interface. Results are sorted by `impact_score` (highest risk first).

| Parameter         | Type      | Required | Description                                                                                                                          |
| ----------------- | --------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `symbol`          | `string`  | Yes      | Symbol name, UID, `path::name`, `Class::method` or `path::Class::method`. Ambiguous names list candidates; pass `repo` or a UID.     |
| `repo`            | `string`  | No       | Repo name or UID to resolve the symbol in.                                                                                           |
| `depth`           | `integer` | No       | Max traversal depth, 1--15. Default 3.                                                                                               |
| `confidence`      | `number`  | No       | Minimum edge confidence, 0--1. Default 0.                                                                                            |
| `min_score`       | `number`  | No       | Minimum impact score, 0--1. Pruned rows are disclosed.                                                                               |
| `limit`           | `integer` | No       | Max impact nodes to return, 1--1000 (default 50). Total count is always reported.                                                    |
| `response_format` | `string`  | No       | `"concise"` returns UID, name, file path, start line, depth and impact score; `"detailed"` (default) adds edge types and confidence. |

Dependents are returned once, as `impact_nodes`. A miss returns `isError: true` with a `not_found` envelope and `did_you_mean` suggestions.

## affected_tests

Prioritize which test files a PR should run by mapping changed files through the call/import graph to test files. Results are bucketed into priority tiers.

| Parameter       | Type       | Required | Description                                                                                                                       |
| --------------- | ---------- | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `changed_files` | `string[]` | No       | Changed file paths (repo-relative), at most 1000. Example: `["src/auth/login.ts"]`. Alias: `files`.                               |
| `base_ref`      | `string`   | No       | Git ref to diff against (e.g. `"main"`). The repository's working tree is compared with the ref.                                  |
| `repo`          | `string`   | No       | Repo name or UID. With `base_ref`, required when more than one local repo is indexed. With `changed_files`, limits the selection. |

Pass exactly one of `changed_files` (or `files`) and `base_ref`. Passing both is refused as an invalid argument. The result names the repository it diffed. Tier 1 = directly references changed symbol, Tier 2 = direct caller, Tier 3 = transitive. A test file selected only because its own top-level code calls a changed function has `selected_by: "top_level_code"`.

Before a `base_ref` diff, NestWeaver checks that the repository's Git metadata belongs to its own checkout and refuses borrowed or redirected metadata. The diff runs with the repository's hooks, fsmonitor, filter, textconv and external-diff programs disabled.

:::caution
Static call-graph regression test selection misses reflection, DI, codegen, and integration/e2e tests. "No tests found" does NOT mean safe to skip testing. Keep periodic full test runs in CI.
:::

## dead_code

List symbols that no entry point reaches by walking forward from all entry points (main, HTTP handlers, event listeners, test runners, and each file's top-level `<module>` code). The output is a review list, never a deletion list.

| Parameter             | Type       | Required | Description                                                                                                  |
| --------------------- | ---------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| `min_confidence`      | `string`   | No       | Minimum confidence: `"low"` (default, show all), `"medium"`, or `"high"` (strong candidates only).           |
| `repos`               | `string[]` | No       | Repo names or UIDs to scope the list to, at most 100.                                                        |
| `limit`               | `integer`  | No       | Max rows to return, 1--1000.                                                                                 |
| `offset`              | `integer`  | No       | Rows to skip. Default 0.                                                                                     |
| `page_token`          | `string`   | No       | Token from a previous page, so the next page keeps the same scope.                                           |
| `expected_generation` | `integer`  | No       | Graph generation from a previous page; a page from a changed graph is refused.                               |
| `response_format`     | `string`   | No       | `"concise"` returns UID, name and confidence; `"detailed"` (default) adds file paths, kinds, and visibility. |

Confidence scoring: High = private/internal symbols, Medium = inferred visibility, Low = public/library API. Public symbols flagged as Low may be consumed by external code.

On a graph built by an older resolver generation, `dead_code` refuses (`refused: true`, `reason: "outdated_resolver"`) and returns the `nestweaver index --repo <path> --force` commands to run. `coverage: "degraded"` means the walk had no roots or could not read its inputs, so every row is unreachable by construction.

## detect_changes

Assess file-level blast radius for a set of changed files. Maps files to symbols, traces transitive dependents, and returns a risk assessment.

Use before committing or reviewing changes. For single-symbol impact, use `brain_impact`. For git diff details, use `brain_diff`.

| Parameter       | Type       | Required | Description                                                        |
| --------------- | ---------- | -------- | ------------------------------------------------------------------ |
| `changed_files` | `string[]` | No       | Changed file paths (repo-relative), at most 1000. Alias: `files`.  |
| `limit`         | `integer`  | No       | Max affected symbols and processes to return, 1--1000. Default 50. |

Returns affected symbols, affected processes, and risk level (`low`, `medium`, `high`).

## hub_nodes

Identify the most connected symbols in the codebase ranked by total degree (incoming + outgoing edges). These are the architectural core.

| Parameter         | Type       | Required | Description                                                                                                             |
| ----------------- | ---------- | -------- | ----------------------------------------------------------------------------------------------------------------------- |
| `limit`           | `integer`  | No       | Number of top hubs to return, 1--1000. Default 10. Aliases: `top`, `top_n`.                                             |
| `repos`           | `string[]` | No       | Repo names or UIDs to scope the ranking to.                                                                             |
| `response_format` | `string`   | No       | `"concise"` returns UID, name, file path and total degree; `"detailed"` (default) adds PageRank scores and cluster IDs. |

Includes cluster membership when a clustering sidecar exists. For chokepoints between communities, use `bridge_nodes` instead.

## bridge_nodes

Find architectural chokepoints -- symbols with high betweenness centrality that sit on many shortest paths between other nodes.

| Parameter         | Type       | Required | Description                                                                                                |
| ----------------- | ---------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| `limit`           | `integer`  | No       | Number of top bridges to return, 1--1000. Default 10. Aliases: `top`, `top_n`.                             |
| `repos`           | `string[]` | No       | Repo names or UIDs to scope the ranking to.                                                                |
| `response_format` | `string`   | No       | `"concise"` returns UID, name, file path and betweenness score; `"detailed"` (default) adds community IDs. |

Betweenness is computed via Brandes' algorithm with sampling (approximate for large graphs). For most-connected nodes by degree, use `hub_nodes`.

## clusters

View the codebase's high-level architecture via Louvain-style local moving community detection. This is not the full Leiden algorithm. The entry point is still named `leiden`.

| Parameter             | Type       | Required | Description                                                                    |
| --------------------- | ---------- | -------- | ------------------------------------------------------------------------------ |
| `resolution`          | `number`   | No       | Resolution. Higher yields more, smaller clusters. Default 0.5.                 |
| `cluster_id`          | `integer`  | No       | Return one cluster by its numeric ID. An unknown ID is a `not_found` miss.     |
| `repos`               | `string[]` | No       | Cluster only the subgraph of these repos, at most 100.                         |
| `limit`               | `integer`  | No       | Max clusters per page, 0--1000. Default 50.                                    |
| `members`             | `integer`  | No       | Member symbols per cluster, 0--200. Default 20.                                |
| `cluster_offset`      | `integer`  | No       | Cluster page offset.                                                           |
| `member_offset`       | `integer`  | No       | Member page offset within a cluster (members are sorted by UID).               |
| `page_token`          | `string`   | No       | Token from a previous page, so the next page keeps the same scope.             |
| `expected_generation` | `integer`  | No       | Graph generation from a previous page; a page from a changed graph is refused. |

Returns cluster name, cohesion score, key files, and member symbols per cluster.

## cross_repo_contracts

Find cross-repository references to a symbol -- other repos that import, re-export, or implement the same symbol name.

| Parameter   | Type      | Required | Description                                                                         |
| ----------- | --------- | -------- | ----------------------------------------------------------------------------------- |
| `uid`       | `string`  | No       | Symbol UID. Preferred for unambiguous lookup.                                       |
| `name`      | `string`  | No       | Symbol name. Alias: `symbol`. Ambiguous names fail. Pass `uid` to pin one symbol.   |
| `name_repo` | `string`  | No       | Repo name or UID used to disambiguate `name`.                                       |
| `repo`      | `string`  | No       | Only return links whose other endpoint is in this repo.                             |
| `limit`     | `integer` | No       | Max contract links to return, 1--1000 (default 50). Total count is always reported. |

Provide either `uid` or `name`. Only useful when multiple repos are indexed in the same brain. Contract links are hypotheses -- check confidence scores before acting.

## contract_drift

Audit API contract drift: routes declared in specs (OpenAPI, `.proto`, GraphQL) but not implemented, and routes implemented but not declared in any spec.

| Parameter | Type      | Required | Description                                                            |
| --------- | --------- | -------- | ---------------------------------------------------------------------- |
| `repo`    | `string`  | No       | Optional repo UID to scope the analysis to a single repository.        |
| `limit`   | `integer` | No       | Max results per drift bucket (default 50). Totals are always reported. |

Returns two buckets: `declared_not_implemented` and `implemented_not_declared`. Contract links are hypotheses derived from spec parsing and handler heuristics.
