---
title: Brain + Obsidian Vault
description: Connect an Obsidian vault or markdown directory to NestWeaver's code graph for unified code and documentation search.
sidebar:
  order: 3
---

NestWeaver's brain links Obsidian vaults and markdown directories to the code graph. This lets you query design decisions, PRDs, meeting notes, and architecture docs alongside code symbols — all ranked together in a single result set.

## Add a vault

Point NestWeaver at your vault or markdown directory. It indexes notes, headings, sections, tags, and wikilinks into the same graph as your code:

```bash
nestweaver brain add ~/Documents/Obsidian/MyVault --db ./brain.lbug
```

Verify the vault was added and check index health:

```bash
nestweaver brain status --db ./brain.lbug
```

This shows vault counts, per-vault staleness, and index health. If you have multiple vaults, each appears as a separate entry.

:::tip
Wiki and HTML content is auto-converted to markdown during ingestion, so you can index Confluence exports, static site docs, or any markdown-compatible directory.
:::

## Exclusion patterns

Place a `.brainignore` file at the vault root to exclude files from indexing. It uses the same line format as `.gitignore` — one glob pattern per line, `#` for comments, blank lines ignored.

```text
# .brainignore
drafts/**
archive/**
_private/**
**/*.excalidraw.md
```

When no `.brainignore` file exists, sensible defaults are applied automatically:

```text
**/.obsidian/**
**/.git/**
**/.trash/**
**/node_modules/**
**/snapshots/**
**/target/**
**/dist/**
**/build/**
```

You can also pass ad-hoc patterns via the `--ignore` flag without creating a file:

```bash
nestweaver brain add ~/my-vault --ignore "drafts/**" --db ./brain.lbug
```

:::tip
A custom `.brainignore` file replaces the defaults entirely. If you create one, include patterns for `.obsidian/**` and `.git/**` unless you specifically want those indexed.
:::

## Connect vault to code

Projects bridge vault folders to code repos. When a project declares a `vault_folder`, notes in that folder become part of the project's context alongside code symbols:

```toml
# nestweaver-instance.toml
[[projects]]
name = "device-onboarding"
description = "End-to-end device onboarding flow"
vault_folder = "Projects/device-onboarding"
repos = ["mobile-app", "device-firmware", "api-service"]
features = ["device-onboarding"]
```

After defining projects, materialize them into the graph:

```bash
nestweaver materialize-projects --config ./nestweaver-instance.toml --db ./brain.lbug
```

NestWeaver also detects implicit projects automatically. If your vault has a `Projects/<slug>/` folder containing a `<slug>.md` entry note, it is recognized as a project during indexing.

## Query across code and notes

The brain's key feature is unified retrieval. When you query, NestWeaver ranks code symbols and vault notes together using the same fusion of graph structure (PPR), text match (BM25), and semantic similarity:

```bash
# Unified context — returns both code symbols and notes, ranked together
nestweaver brain context "authentication" --db ./brain.lbug

# Search across everything
nestweaver brain search "database migration" --db ./brain.lbug

# Scoped to a project (vault notes + code from project repos)
nestweaver project-context device-onboarding --db ./brain.lbug
```

The `[cross_domain]` section in your instance config tunes how NestWeaver bridges notes to code symbols:

```toml
[cross_domain]
stoplist_extend = ["Platform", "Service", "Manager"]
min_symbol_name_length = 4
```

This prevents overly generic words from creating spurious note-to-symbol connections.

## Keep it fresh

Vault content changes as you write notes. NestWeaver offers several ways to stay current.

**Live watching** — re-indexes automatically as files change:

```bash
nestweaver brain watch ~/my-vault --db ./brain.lbug
```

**Scheduled refresh** — pair the watcher with `--refresh-wiki-hours` to also periodically re-fetch external wiki sources declared in your instance config:

```bash
nestweaver brain watch ~/my-vault --db ./brain.lbug \
  --refresh-wiki-hours 6 --config ./nestweaver-instance.toml
```

**Manual refresh** — force a full re-index of all registered vaults:

```bash
nestweaver brain refresh ~/my-vault --db ./brain.lbug
```

**Stale check** — compare each repo's indexed SHA against git HEAD to see if the graph is behind:

```bash
nestweaver brain stale-check --db ./brain.lbug
```

## Health checks

NestWeaver provides several commands to audit vault health and spot problems:

```bash
# One-shot health summary: note/wikilink counts, broken links, orphans, top tags
nestweaver brain doc-stats --db ./brain.lbug

# List wikilinks with ambiguous or low-confidence targets, with suggested fixes
nestweaver brain broken-links --db ./brain.lbug

# List notes with zero inbound and zero outbound wikilinks
nestweaver brain orphans --db ./brain.lbug

# Detect topic clusters via community detection over note wikilinks
nestweaver brain topic-clusters --db ./brain.lbug

# Show a tag's note count and co-occurring tags
nestweaver brain tag-graph --db ./brain.lbug
```

:::tip
Run `brain doc-stats` periodically to catch drift. A rising broken-link count usually means notes were renamed without updating wikilinks. `brain broken-links` will suggest fixes.
:::
