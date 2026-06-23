---
title: Personalized PageRank
description: How NestWeaver uses Personalized PageRank to extract only task-relevant code context within a token budget.
sidebar:
  order: 3
---

Standard PageRank measures global importance — which nodes in a graph are most connected overall. Personalized PageRank (PPR) measures relevance to a specific starting point. NestWeaver uses PPR to answer the question "given that I'm working on symbol X, which other symbols are most relevant?" by walking the graph outward from query seeds.

PPR is one of three signals NestWeaver fuses for retrieval (alongside BM25 and semantic similarity), weighted at 40% by default. See [Token-Budget Extraction](/concepts/token-budget/) for how the three signals combine.

## Forward Push algorithm

NestWeaver implements PPR using the **Forward Push** (LocalPush) algorithm rather than power iteration. Instead of iterating over every node in the graph each step, Forward Push maintains a residual vector and only pushes mass from nodes whose residual exceeds a threshold. On sparse graphs where PPR mass concentrates near the seeds — which is the typical case for code queries — this is dramatically faster.

Performance characteristics:

- **Sub-10ms** graph walks on typical codebases
- **~8ms** for repeated queries (LRU cached)
- **7ms** query embedding on Metal (Apple Silicon), 37ms on CPU

The algorithm uses a damping factor of 0.75 (probability of following an edge vs. teleporting back to a seed) and a residual threshold of 1e-6 for convergence.

```bash
# PPR drives the context command — seeds are resolved from your query
nestweaver context "processPayment"
```

## Edge-type weights

Not all relationships carry equal weight for relevance propagation. Each edge type has a base weight that controls how much PPR mass flows through it:

| Edge type                | Weight | Rationale                                     |
| ------------------------ | ------ | --------------------------------------------- |
| `CALLS`                  | 1.0    | Direct invocation — strongest coupling signal |
| `EXTENDS` / `IMPLEMENTS` | 0.9    | Inheritance — nearly as strong as a call      |
| `IMPORTS`                | 0.7    | Dependency without call detail                |
| `USES`                   | 0.5    | Type reference — real but weaker              |
| `ACCESSES`               | 0.4    | Field/property access — medium coupling       |
| `MEMBER_OF` / `INCLUDES` | 0.2    | Structural containment                        |

When building the adjacency data for a PPR walk, each edge's weight is multiplied into the transition probability. A `CALLS` edge transmits full PPR mass; an `ACCESSES` edge transmits 40%. This means the graph walk naturally favors paths through strong coupling over weak structural relationships.

## Intent tuning

Different queries benefit from different edge-weight profiles. The `--intent` flag adjusts multipliers layered on top of base weights to tune retrieval for specific query types:

```bash
# Default: balanced weights
nestweaver context "UserService"

# Intent-tuned: emphasize call chains for debugging
nestweaver context "UserService" --intent debug

# Intent-tuned: emphasize type relationships for refactoring
nestweaver context "UserService" --intent refactor
```

Intent detection can also be automatic — NestWeaver analyzes the query text to infer whether you're debugging, exploring, refactoring, or investigating impact, and adjusts the edge multipliers accordingly.

The intent system applies a multiplier to specific edge types. For example, a "debug" intent might boost `CALLS` edges with a 1.5x multiplier while keeping other edge types at 1.0x. The final edge weight is `base_weight * intent_multiplier`.

## Interaction memory

With `--track-interactions` enabled, NestWeaver learns from agent query patterns over time. Each time a symbol appears in a context query result, its interaction score increases. These scores are then blended into the PPR personalization vector at a conservative 5% weight.

```bash
# Enable interaction tracking
nestweaver context "processPayment" --track-interactions

# View interaction statistics
nestweaver interactions list
```

The interaction memory uses an **exploration floor** to prevent feedback loops. Every seed's personalization weight is scaled by `(1 - 0.05)`, with only the remaining 5% redistributed according to interaction history. This means a newly-seeded, never-before-accessed node always retains 95% of its original personalization mass — it can never be driven to zero by historical popularity.

Privacy guarantees:

- **Local-only** — interaction data never leaves your machine
- **UIDs and timestamps only** — no source code, no symbol bodies, no query text
- Stored in a sidecar file (`.interactions.json`) alongside the database
- Clear at any time with `nestweaver interactions clear`

## Confidence-weighted blast radius

Impact analysis uses PPR with multiplicative decay to compute a **blast radius** — the set of symbols affected by a change, ranked by how strongly the change propagates.

```bash
# Trace the impact of changing a symbol
nestweaver impact "UserService.getUser"
```

Each symbol in the impact result gets an `impact_score` that decays multiplicatively through edges. If `UserService.getUser` is called by `PaymentController.processPayment` (confidence 0.9) which is called by `CheckoutHandler.handle` (confidence 0.7), the impact score for `CheckoutHandler.handle` is `0.9 * 0.7 = 0.63`.

Low-confidence paths are pruned — if any edge in a path drops the cumulative impact score below a threshold, that branch is cut. This prevents noise from speculative type inference from polluting impact results.

:::tip[Token efficiency]
Use `nestweaver impact --json` in subagents and scripts. The JSON output includes `impact_score` for each affected symbol, letting your agent make programmatic decisions about which files to examine without reading the full output.
:::
