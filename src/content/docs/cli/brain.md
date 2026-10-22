---
title: Brain Commands
description: Manage Obsidian vaults, markdown notes, and knowledge sources connected to NestWeaver's code graph.
sidebar:
  order: 5
---

Brain commands connect Obsidian vaults and markdown directories to the code knowledge graph. Once added, notes, headings, sections, wikilinks, and tags become queryable alongside code symbols — the same PPR-based context retrieval works across both worlds. Use `.brainignore` for glob exclusion patterns or `--ignore` for ad-hoc filtering.

## Vault management

| Command         | Description                                             | Key Flags                                                                                                            |
| --------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `brain add`     | Index a vault into the knowledge graph                  | `--name`, `--instance`, `--db`, `--config`, `--ignore`                                                               |
| `brain remove`  | Remove a vault (cascade-deletes nodes; files untouched) | positional vault path, `--instance`, `--db`, `--config`                                                              |
| `brain list`    | List all indexed vaults with note counts                | `--json`, `--db`                                                                                                     |
| `brain status`  | Show vault counts, staleness, and index health          | `--json`, `--db`, `--config`                                                                                         |
| `brain refresh` | Force a full re-index of one vault                      | positional vault path, `--name`, `--instance`, `--db`, `--config`, `--since`, `--ignore`, `--json`, `--fail-on-skip` |
| `brain diff`    | Show what changed in a repo since it was last indexed   | positional repo, `--since-sha`, `--limit`, `--json`, `--db`                                                          |

## Querying

| Command         | Description                                    | Key Flags                                                                                                                        |
| --------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `brain search`  | BM25 full-text search across notes and symbols | `--limit` (per kind), `--json`, `--config`, `--prf`                                                                              |
| `brain context` | Unified PPR context across code + notes        | `--token-budget`, `--limit`, `--kinds`, `--repos`, `--vaults`, `--path-prefix`, `--tags`, `--exclude-tags`, `--intent`, `--json` |

## Watching

| Command                | Description                           | Key Flags                                                                                                        |
| ---------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `brain watch`          | Watch vault for changes and re-index  | positional vault path, `--name`, `--instance`, `--db`, `--ignore`, `--config`, `--refresh-wiki-hours`, `--force` |
| `brain stale-check`    | Compare indexed SHA against git HEAD  | `--json`, `--db`                                                                                                 |
| `brain reindex-search` | Rebuild the Tantivy BM25 search index | `--db`                                                                                                           |

## Health

| Command                | Description                                          | Key Flags                                                  |
| ---------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| `brain broken-links`   | List wikilinks with ambiguous/low-confidence targets | `--max-suggestions`, `--limit`, `--json`                   |
| `brain orphans`        | List notes with zero inbound and outbound wikilinks  | `--vault`, `--path-prefix`, `--allow`, `--limit`, `--json` |
| `brain topic-clusters` | Detect topic clusters via Louvain-style local moving | `--resolution`, `--limit`, `--json`                        |
| `brain tag-graph`      | Show tag note count and co-occurring tags            | `--limit`, `--json`                                        |
| `brain doc-stats`      | One-shot health summary                              | `--top-tags-limit`, `--json`                               |

## Memory

| Command              | Description                                        | Key Flags                                     |
| -------------------- | -------------------------------------------------- | --------------------------------------------- |
| `memory lint`        | Health checks: stale notes, broken links, orphans  | `--limit`, `--json`, `--config`               |
| `memory consolidate` | Propose/apply tier promotions (dry-run by default) | `--apply`, `--limit`, `--json`, `--config`    |
| `memory related`     | Typed-edge traversal from a note                   | `--edge-type`, `--depth`, `--limit`, `--json` |

## Adding and searching a vault

```bash
# Add an Obsidian vault
nestweaver brain add ~/Documents/Obsidian/MyVault

# Add with a custom name and ignore patterns
nestweaver brain add ~/notes --name work-notes --ignore "drafts/**,archive/**"

# List indexed vaults
nestweaver brain list --json

# Check vault health
nestweaver brain status
```

`brain search --limit` caps notes and code symbols separately (1–1000, default 20), so a query matching both can return up to twice the limit. A vault name must be unique in the database, ignoring case; give a second vault whose folder has the same name its own `--name`.

`brain refresh <path>` re-indexes the one vault at that path. `--json` prints one result object with every skipped file, and `--fail-on-skip` exits 1 when a note was skipped for any reason other than a `.brainignore` exclusion. `brain status` also reports an interrupted vault refresh or embedding pass until it finishes, and a watcher that could not publish a batch.

## Changes since the last index

```bash
nestweaver brain diff my-service
nestweaver brain diff my-service --since-sha abc123 --limit 200 --json
```

`brain diff` lists the files added, modified or deleted in a local repo since its indexed SHA (or `--since-sha`), plus the symbols they affect. It is the CLI twin of the MCP `brain_diff` tool. `--limit` is 1–1000, default 50.

## Searching across code and notes

```bash
# Full-text search
nestweaver brain search "authentication flow"

# Search with pseudo-relevance feedback for better recall
nestweaver brain search "payment processing" --prf --limit 10

# Unified context with filtering
nestweaver brain context "authentication" --token-budget 4000 --kinds Symbol,Note

# Filter to specific tags
nestweaver brain context "billing" --tags "project/freeplay" --exclude-tags "archive"

# Filter to specific repos or vaults
nestweaver brain context "deployment" --repos my-api --vaults work-notes
```

:::tip[Token efficiency]
Use `--kinds`, `--tags`, `--repos`, and `--path-prefix` filters on `brain context` to narrow results and reduce token usage. The `--token-budget` flag truncates output to fit an approximate token count, ideal for LLM context windows.
:::

## Vault health

```bash
# One-shot health summary
nestweaver brain doc-stats

# Find broken wikilinks with suggestions
nestweaver brain broken-links --max-suggestions 3

# Find orphan notes
nestweaver brain orphans --path-prefix Workspaces/

# Detect topic clusters
nestweaver brain topic-clusters --resolution 0.5

# Show tag co-occurrence
nestweaver brain tag-graph project/myproject
```

## Memory operations

```bash
# Run health checks
nestweaver memory lint --json

# Propose tier promotions (dry-run)
nestweaver memory consolidate

# Apply promotions
nestweaver memory consolidate --apply

# Traverse typed relationships from a note
nestweaver memory related note:abc123 --edge-type Supersedes --depth 3
```

`memory consolidate` proposes promotions from daily logs to ideas to project files. Dry-run by default — use `--apply` to move files. `--limit` (1–1000, default 50) is applied before anything moves, so `--apply` moves at most that many notes. `--apply` with nothing to do exits 0. Proposals an earlier apply already moved are counted in `proposals_already_applied`, and `refresh_vault_paths` names the vaults to refresh so the graph matches the moved files. `memory related` walks Supersedes, DependsOn, CausedBy, and RelatesTo edges.
