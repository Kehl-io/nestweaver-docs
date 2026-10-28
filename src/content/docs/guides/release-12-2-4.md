---
title: 12.2.4 release and upgrade
description: PHP and Scala graph repairs, Markdown links, source freshness, backup recovery and verified agent setup.
sidebar:
  order: 8
---

NestWeaver 12.2.4 repairs graph and source freshness while retaining 43 MCP tools
(six in lite mode), 32 supported languages and the existing daemon architecture.

## What changed

- **PHP resolution:** repository-wide namespace and `use function` alias lookup
  restores cross-directory calls. New, renamed or removed declarations trigger
  conservative caller repair; ambiguous duplicates remain unresolved.
- **Scala caches:** grammar-dependent cached facts are invalidated so declarations
  recovered by the updated grammar are rebuilt instead of silently reused.
- **Vault links:** Markdown derivation version 3 resolves percent-encoded URL paths
  and proven absolute note paths within the originating vault. Root escapes and
  symlink escapes are refused; literal wikilink spelling remains unchanged.
- **Source freshness:** selected-file metadata refreshes after reindex and ownership
  or workspace changes; unavailable source bodies retain indexed metadata/actions.
- **Backup recovery:** interrupted restores use retry-owned write authority while
  preserving existing data when replacement cannot be authorized.
- **Dependencies and MCP packaging:** refreshed frontend dependencies and CI pins;
  npm ownership metadata and a version-matched registry manifest. A registry
  listing still requires a separate authenticated submission.

See the [complete changelog](https://github.com/Kehl-io/nestweaver/releases/tag/v12.2.4).

## Upgrade

```sh
npm install --global nestweaver@12.2.4
nestweaver --version
nestweaver index --repo /path/to/repo --db /path/to/nestweaver.lbug --force
nestweaver brain refresh /path/to/vault --db /path/to/nestweaver.lbug
nestweaver stale-check --db /path/to/nestweaver.lbug
```

Run the forced index **once per repository** and refresh **each registered vault**.
Keep the installation's usual `--db` and `--config` bindings throughout. Resolver
generation is **19**, compared with **17** in 12.2.3; parsed cache is **13**, compared
with **11**. Cache invalidation alone does not rewrite stored edges. Plain
incremental indexing at HEAD can do nothing and leave the graph stale.
`stale-check` exits 2 on a resolver mismatch, and `dead-code` refuses stale results.
Vault derivation is separate from repository generation.

New databases need no migration. A database from before LadybugDB 0.21 needs the
separate [storage publication rebuild](https://github.com/Kehl-io/nestweaver/blob/main/docs/guide/publication-rebuild.md#storage-engine-upgrade-ladybugdb-021-rebuild-required),
not only a forced index. Linux release archives need their bundled `lib/` folder.
The macOS app remains source-build-only; no app bundle or DMG is published.

## Reconnect agents and check coverage

After setup or upgrading, reconnect the MCP client and verify tool discovery,
`brain_status`, a known symbol and a real caller. See
[agent verification](/integrations/verification/) and the adapter-specific
[integration reference](/configuration/integrations/). Setup supports 16 adapters;
not all adapters write a config that their current client consumes without manual
steps. The standard MCP connection is local stdio and does not require a model or
API key. Embeddings are optional.

Configured project changes need materialization with the same config/database;
trigram indexing is optional and should be checked through its stale/fallback
disclosures. Inspect status and freshness warnings before trusting answers.

## Validation limits

Manual main testing covered private native UI, graph/CLI/MCP and backup scenarios,
with independently judged results. No new product regression was established in
those finite cases; this is not proof of universal correctness. Affected-owner
macOS app testing, model quality and large production workloads remain separate.
Historical June benchmarks were not rerun for this release.
