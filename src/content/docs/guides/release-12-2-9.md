---
title: 12.2.9 release and upgrade
description: Back up before upgrading and check whether your existing graph needs a reindex.
sidebar:
  order: 9
---

NestWeaver 12.2.9 updates seven Rust dependencies. Existing 12.2.8 graphs stay compatible with resolver generation **24**, parsed cache **18**, Markdown derivation **4**, and LadybugDB **0.22.3** storage format **49**.

## Upgrade an existing database

1. Stop the old daemon. If a service manager starts it, stop the service during backup and installation.
2. With the previous binary, save a backup outside the database and publication directories. Preserve that binary for rollback.

   ```sh
   nestweaver backup save /path/to/backup-before-12-2-9.nwsnap.zst --db /path/to/nestweaver.lbug --config /path/to/instance.toml
   ```

3. Install 12.2.9 and verify the version.

   ```sh
   npm install --global nestweaver@12.2.9
   nestweaver --version
   ```

4. Check the graph and vault using the same database and config bindings.

   ```sh
   nestweaver stale-check --db /path/to/nestweaver.lbug --config /path/to/instance.toml
   nestweaver brain status --db /path/to/nestweaver.lbug --config /path/to/instance.toml --json
   ```

   For each repository reported as `outdated_resolver`, run `nestweaver index --repo /path/to/repo --force` with the same bindings. Refresh a vault with `nestweaver brain refresh /path/to/vault` only if it still reports that it needs refreshing after startup.

5. Reconnect your agent and [verify tool discovery and a known-symbol query](/integrations/verification/).

## Rollback

Restore the pre-upgrade backup with the previous binary to return to the saved graph. Keep the original source notes alongside your backup so restored vaults can still serve note bodies and links. Older databases can migrate storage format 47 to 49 on a writable open. See the [storage and rollback guide](https://github.com/Kehl-io/nestweaver/blob/v12.2.8/docs/guide/publication-rebuild.md#ladybugdb-022-storage-format-and-rollback).

[GitHub release notes](https://github.com/Kehl-io/nestweaver/releases/tag/v12.2.9)
