---
title: 12.2.6 release and upgrade
description: Back up before installing, force-index repositories for resolver generation 22, and check whether vault refresh applies.
sidebar:
  order: 10
---

NestWeaver 12.2.6 preserves useful context when another seed is ambiguous, repairs automatic vault policy refresh, and improves graph and export diagnostics. Existing graphs need one forced repository re-index for resolver generation **22** and parsed cache version **16**, with a vault refresh if also crossing an earlier Markdown derivation upgrade.

LadybugDB **0.22.1** is unchanged from 12.2.5. This is a resolver/cache upgrade from 12.2.5, not a new storage-engine migration. Older installations crossing into LadybugDB 0.22 can still migrate storage format 47 to 49 when opened for writes; the previous engine cannot read format 49.

## Upgrade an existing database

1. Stop the old daemon. If a service manager runs it, stop the service so it cannot restart during the backup or installation.
2. With the **previous** binary, save a backup outside the database and publication directories. Keep the old binary and the same database and config bindings:

   ```sh
   nestweaver backup save /path/to/backup-before-12-2-6.nwsnap.zst --db /path/to/nestweaver.lbug --config /path/to/instance.toml
   ```

3. Install the pinned release, then check the executable version:

   ```sh
   npm install --global nestweaver@12.2.6
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

   Markdown derivation remains **3**, unchanged from 12.2.5. If also crossing an earlier Markdown derivation upgrade, refresh each registered vault using the same bindings:

   ```sh
   nestweaver brain refresh /path/to/vault --db /path/to/nestweaver.lbug --config /path/to/instance.toml
   ```

   This repairs encoded URL paths and proven absolute in-vault note paths; upgrades from before 12.2.2 also need the earlier frontmatter wikilink/block-reference refresh. A repository index does not refresh stored vault links. An otherwise current 12.2.5 vault does not need a full refresh solely because this release changes the code resolver.

5. Reconnect agent clients and [verify real tool discovery and known-symbol queries](/integrations/verification/). A successful CLI command or written registration file alone does not establish MCP activation.

New databases do not need a migration. Existing databases from before the LadybugDB 0.21 string-hash change still require the documented [publication rebuild procedure](https://github.com/Kehl-io/nestweaver/blob/v12.2.6/docs/guide/publication-rebuild.md#storage-engine-upgrade-ladybugdb-021-rebuild-required).

## Rollback

Keep the pre-upgrade backup even when moving from 12.2.5. To return to the saved state, reinstall the previous binary and restore that backup using its documented restore procedure. For older engines crossing the 47→49 storage boundary, a database or publication predecessor already opened writable by the new engine cannot replace the old-binary backup. See the [storage and rollback guide](https://github.com/Kehl-io/nestweaver/blob/v12.2.6/docs/guide/publication-rebuild.md#ladybugdb-022-storage-format-and-rollback).

## What changed

- Mixed valid and ambiguous context seeds keep useful ranked results and bounded per-seed diagnostics across MCP, CLI and federation. Explicit tags use tag resolution.
- Automatic `.brainignore` reconciliation handles exclusions and reinclusion; full vault replacement records code-link repair debt for retained notes.
- File-tree scrolling reserves room for folder headers and alerts. Historical Compare JSON, Copy and Save preserve available bounded edge and publication evidence.
- JavaScript/TypeScript anonymous default callables own their body calls, and component-function spans account for destructured/default parameters.
- Database-query errors identify the selected local database where known. npm publication verifies all four exact native packages before publishing the launcher.

See the [complete v12.2.6 release notes](https://github.com/Kehl-io/nestweaver/releases/tag/v12.2.6). Historical performance, platform and host-activation qualifications remain in their original validation records; this guide does not replace them.
