---
title: Brain Commands
description: Manage Obsidian vaults, markdown notes, and knowledge sources connected to NestWeaver's code graph.
sidebar:
  order: 5
---

Brain commands connect Obsidian vaults and markdown directories to the code knowledge graph. Once added, notes, headings, sections, wikilinks, and tags become queryable alongside code symbols — the same PPR-based context retrieval works across both worlds. Use `.brainignore` for glob exclusion patterns or `--ignore` for ad-hoc filtering.

## Vault management

| Command         | Description                                             | Key Flags                                              |
| --------------- | ------------------------------------------------------- | ------------------------------------------------------ |
| `brain add`     | Index a vault into the knowledge graph                  | `--name`, `--instance`, `--db`, `--config`, `--ignore` |
| `brain remove`  | Remove a vault (cascade-deletes nodes; files untouched) | `--instance`, `--db`                                   |
| `brain list`    | List all indexed vaults with note counts                | `--json`, `--db`                                       |
| `brain status`  | Show vault counts, staleness, and index health          | `--json`, `--db`, `--config`                           |
| `brain refresh` | Force re-index of a vault                               | `--name`, `--instance`, `--db`, `--since`, `--ignore`  |

## Querying

| Command         | Description                                    | Key Flags                                                                                                                        |
| --------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `brain search`  | BM25 full-text search across notes and symbols | `--limit`, `--json`, `--config`, `--prf`                                                                                         |
| `brain context` | Unified PPR context across code + notes        | `--token-budget`, `--limit`, `--kinds`, `--repos`, `--vaults`, `--path-prefix`, `--tags`, `--exclude-tags`, `--intent`, `--json` |

## Watching

| Command                | Description                           | Key Flags                                                                      |
| ---------------------- | ------------------------------------- | ------------------------------------------------------------------------------ |
| `brain watch`          | Watch vault for changes and re-index  | `--name`, `--instance`, `--db`, `--ignore`, `--config`, `--refresh-wiki-hours` |
| `brain stale-check`    | Compare indexed SHA against git HEAD  | `--json`, `--db`                                                               |
| `brain reindex-search` | Rebuild the Tantivy BM25 search index | `--db`                                                                         |

## Health

| Command                | Description                                          | Key Flags                                                  |
| ---------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| `brain broken-links`   | List wikilinks with ambiguous/low-confidence targets | `--max-suggestions`, `--limit`, `--json`                   |
| `brain orphans`        | List notes with zero inbound and outbound wikilinks  | `--vault`, `--path-prefix`, `--allow`, `--limit`, `--json` |
| `brain topic-clusters` | Detect topic clusters via Leiden community detection | `--resolution`, `--limit`, `--json`                        |
| `brain tag-graph`      | Show tag note count and co-occurring tags            | `--limit`, `--json`                                        |
| `brain doc-stats`      | One-shot health summary                              | `--top-tags-limit`, `--json`                               |

## Memory

| Command              | Description                                        | Key Flags                          |
| -------------------- | -------------------------------------------------- | ---------------------------------- |
| `memory lint`        | Health checks: stale notes, broken links, orphans  | `--json`, `--config`               |
| `memory consolidate` | Propose/apply tier promotions (dry-run by default) | `--apply`, `--json`, `--config`    |
| `memory related`     | Typed-edge traversal from a note                   | `--edge-type`, `--depth`, `--json` |

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

`memory consolidate` proposes promotions from daily logs to ideas to project files. Dry-run by default — use `--apply` to move files. `memory related` walks Supersedes, DependsOn, CausedBy, and RelatesTo edges.
