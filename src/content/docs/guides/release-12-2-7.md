---
title: 12.2.7 release and upgrade
description: Back up before installing, force-index repositories for resolver generation 23, and check whether vault refresh applies.
sidebar:
  order: 9
---

NestWeaver 12.2.7 repairs Scala parser facts and prevents valid PageRank artifacts from failing JSON checksum validation. Existing graphs need one forced repository re-index for resolver generation **23** and parsed cache **17**; 12.2.6 used 22/16.

LadybugDB advances from **0.22.1** to **0.22.3**, adding a torn-WAL read-bounds fix while retaining storage format **49**. This patch adds no new storage-format migration from 12.2.6. Older installations crossing into LadybugDB 0.22 can still migrate format 47 to 49 on writable open, so preserve the previous binary and pre-upgrade backup.

## Upgrade an existing database

1. Stop the old daemon. If a service manager runs it, stop the service so it cannot restart during the backup or installation.
2. With the **previous** binary, save a backup outside the database and publication directories. Keep the old binary and the same database and config bindings:

   ```sh
   nestweaver backup save /path/to/backup-before-12-2-7.nwsnap.zst --db /path/to/nestweaver.lbug --config /path/to/instance.toml
   ```

3. Install the pinned release, then check the executable version:

   ```sh
   npm install --global nestweaver@12.2.7
   nestweaver --version
   ```

   For other installation methods, see [Installation](/getting-started/). Preserve the installation's normal service-manager setup; installing the CLI does not re-index its database.

4. Force re-index **every** repository once using its usual database and config bindings:

   ```sh
   nestweaver index --repo /path/to/repo --db /path/to/nestweaver.lbug --config /path/to/instance.toml --force
   nestweaver stale-check --db /path/to/nestweaver.lbug --config /path/to/instance.toml
   nestweaver brain status --db /path/to/nestweaver.lbug --config /path/to/instance.toml --json
   ```

   A plain incremental index can skip a repository already at Git HEAD and leave its old facts in place. Resolver compatibility is an exact generation match; generation-stale repositories remain unsuitable for edge-dependent answers until rebuilt. Inspect status and coverage disclosures as well as the command exit codes.

   Markdown derivation remains **3**, unchanged from 12.2.6. If also crossing an earlier Markdown derivation upgrade, refresh each registered vault using the same bindings:

   ```sh
   nestweaver brain refresh /path/to/vault --db /path/to/nestweaver.lbug --config /path/to/instance.toml
   ```

   This repairs encoded URL paths and proven absolute in-vault note paths; upgrades from before 12.2.2 also need the earlier frontmatter wikilink/block-reference refresh. A repository index does not refresh stored vault links. An otherwise current 12.2.6 vault does not need a full refresh solely because this release changes the code resolver.

5. Reconnect agent clients and [verify real tool discovery and known-symbol queries](/integrations/verification/). A successful CLI command or written registration file alone does not establish MCP activation.

New databases do not need a migration. Existing databases from before the LadybugDB 0.21 string-hash change still require the documented [publication rebuild procedure](https://github.com/Kehl-io/nestweaver/blob/v12.2.7/docs/guide/publication-rebuild.md#storage-engine-upgrade-ladybugdb-021-rebuild-required).

## Rollback

Keep the pre-upgrade backup even when moving from 12.2.6. To return to the saved state, reinstall the previous binary and restore that backup using its documented restore procedure. For older engines crossing the 47→49 storage boundary, a database or publication predecessor already opened writable by the new engine cannot replace the old-binary backup. See the [storage and rollback guide](https://github.com/Kehl-io/nestweaver/blob/v12.2.7/docs/guide/publication-rebuild.md#ladybugdb-022-storage-format-and-rollback).

## What changed

- Scala grammar 0.26.9 recovers Scala 2 `given`/`enum` functions, calls and return bindings. New cache and resolver versions also repair unchanged source after a forced index.
- JSON parsing preserves fractional PageRank values exactly, so valid saved artifacts retain their checksums. Even a one-ULP altered payload still fails integrity validation; the artifact schema and checksum remain unchanged.
- Native source and ABI pins agree on LadybugDB 0.22.3. Tree-sitter advances to 0.27.2, UUID to 1.29.2 and openssl-sys to 0.9.118.
- Equivalent iterator and Boolean cleanups satisfy Rust 1.100 Clippy while preserving ranking, publication admission and vault-path matching.

Validation includes native parser-cache/graph upgrade tests, captured-float and tamper regressions, parser/store/engine suites and a disposable old/new/old storage witness. Historical manual-soak, ignored-test and affected-host qualifications remain separate.

See the [complete v12.2.7 release notes](https://github.com/Kehl-io/nestweaver/releases/tag/v12.2.7). Installing a new binary does not upgrade or re-index a live vault.
