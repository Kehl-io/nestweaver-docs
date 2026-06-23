---
title: Token-Budget Extraction
description: How NestWeaver extracts only task-relevant code context within a caller-specified token budget using graph ranking.
sidebar:
  order: 2
---

AI agents have limited context windows. Dumping entire files into a prompt wastes tokens on imports, boilerplate, and irrelevant code — leaving less room for the symbols that actually matter to the task. NestWeaver solves this by letting callers specify a token budget, then filling that budget with the highest-ranked, most task-relevant code from the graph.

## How token budgets work

Every context query accepts a `token_budget` parameter (default: 3000 tokens). NestWeaver ranks all symbols in the graph by relevance to your query, then greedily fills the budget from the top of the ranked list until adding the next symbol would exceed the limit.

```bash
# Get context for a symbol within 2000 tokens
nestweaver context "UserService" --token-budget 2000

# Default budget is 3000 tokens
nestweaver context "processPayment"
```

The budget controls the output size, not the computation. NestWeaver still ranks the entire relevant subgraph — it just truncates the response to fit your window.

## Three retrieval signals

Ranking is not based on a single metric. NestWeaver fuses three independent retrieval signals via **convex combination** to produce a final relevance score for each symbol:

| Signal                    | Default weight | What it captures                                                                                                                                        |
| ------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Personalized PageRank** | 0.40           | Structural importance relative to the query seeds — follows call chains, imports, and type relationships through the graph                              |
| **BM25**                  | 0.25           | Text match — keyword relevance using the Tantivy full-text index with pseudo-relevance feedback expansion                                               |
| **Semantic similarity**   | 0.35           | Embedding-based similarity — natural language queries matched against symbol and note embeddings (local BERT model, Metal-accelerated on Apple Silicon) |

The combined score for each symbol is:

```
score = 0.40 * ppr + 0.25 * bm25 + 0.35 * semantic
```

Weights are configurable in your `instance.toml`:

```toml
[embedding]
weight_ppr = 0.40
weight_bm25 = 0.25
weight_semantic = 0.35
```

:::tip[Token efficiency]
The three-signal fusion means you can query with natural language ("how does authentication work") and get structurally relevant results, not just keyword matches. This is especially useful when you don't know the exact symbol name.
:::

## Response formats

NestWeaver supports two response formats that trade detail for token efficiency:

- **`"detailed"`** (default) — includes full symbol bodies, file paths, line numbers, edge lists, and metadata
- **`"concise"`** — strips bodies to signatures and key lines, omits verbose metadata, typically **~60% fewer tokens** than detailed

```bash
# Concise format for tight context windows
nestweaver context "UserService" --format concise

# Detailed format when you need full implementations
nestweaver context "UserService" --format detailed
```

When using NestWeaver via MCP tools, set `response_format: "concise"` in the tool arguments. The concise format is strongly recommended for subagent and batch queries where token cost matters.

## Filtering

Before ranking begins, you can narrow the candidate set using filters. Filtering happens before the graph walk, so it reduces computation as well as output:

| Filter         | Effect                                                                   |
| -------------- | ------------------------------------------------------------------------ |
| `repos`        | Restrict to symbols from specific repositories                           |
| `tags`         | Include only symbols/notes with matching tags (e.g., `project/payments`) |
| `exclude_tags` | Remove symbols/notes with specific tags                                  |
| `path_prefix`  | Restrict to files under a directory (e.g., `src/api/`)                   |
| `kinds`        | Filter by symbol kind (e.g., `function`, `class`, `interface`)           |

```bash
# Context scoped to a specific repo and directory
nestweaver context "checkout" --repos payments-api --path-prefix src/api/

# MCP tool call with tag filtering
nestweaver context "billing" --tags project/freeplay --format concise
```

Filters are combinative — specifying multiple filters intersects them. This lets you efficiently target the exact subset of the graph relevant to your task.

## Example

A typical context query for an agent working on a payment processing feature:

```bash
nestweaver context "UserService" --token-budget 2000 --format concise
```

Representative output:

```
UserService (class) — src/services/user-service.ts:15
  Relevance: 0.92 | PPR: 0.88 | BM25: 0.95 | Semantic: 0.94

  class UserService {
    constructor(private db: DatabasePool, private cache: RedisClient)
    async getUser(id: string): Promise<User>
    async updateProfile(id: string, data: ProfileUpdate): Promise<User>
    async deleteUser(id: string): Promise<void>
  }

  Called by: PaymentController.processPayment, AuthMiddleware.validateSession
  Calls: DatabasePool.query, RedisClient.get, RedisClient.set
  Imported by: payment-controller.ts, auth-middleware.ts, user-router.ts

UserRepository (class) — src/repositories/user-repository.ts:8
  Relevance: 0.71 | PPR: 0.65 | BM25: 0.70 | Semantic: 0.78

  class UserRepository {
    async findById(id: string): Promise<User | null>
    async update(id: string, data: Partial<User>): Promise<User>
  }

(2 symbols, ~480 tokens)
```

The output fits within the 2000-token budget and contains only the symbols most relevant to `UserService` — ranked by a combination of graph proximity, text match, and semantic similarity.
