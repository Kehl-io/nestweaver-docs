---
title: 12.2.5 release and upgrade
description: Back up before the LadybugDB storage upgrade, then re-index repositories for resolver generation 21.
sidebar:
  order: 9
---

Before upgrading an existing database to NestWeaver 12.2.5, stop the old daemon and back up the database with the old binary. LadybugDB 0.22.1 can migrate a database from storage format 47 to 49 when it opens or checkpoints it for writes. The previous engine cannot read format 49.

## Upgrade an existing database

1. Stop the old daemon. If a service manager runs it, stop the service so it cannot restart during the backup.
2. With the **previous** binary, save a backup outside the database and publication directories. Use the same database and config that the daemon normally uses.

   ```sh
   nestweaver backup save /path/to/backup-before-12-2-5.nwsnap.zst --db /path/to/nestweaver.lbug --config /path/to/instance.toml
   ```

3. [Install 12.2.5](/getting-started/). Re-index each repository once with `--force`. A plain incremental index can skip a repository that is already at Git HEAD. Use the normal database and config bindings:

   ```sh
   nestweaver index --repo /path/to/repo --db /path/to/nestweaver.lbug --config /path/to/instance.toml --force
   nestweaver stale-check --db /path/to/nestweaver.lbug --config /path/to/instance.toml
   ```

   Resolver generation is **21** and parsed cache version is **15**. If you are also crossing the earlier Markdown derivation upgrade, follow the [12.2.4 vault refresh instructions](/guides/release-12-2-4/).

To downgrade after a storage migration, reinstall the previous binary and restore the backup taken in step 2. A publication predecessor opened for writes by the new engine cannot substitute for that backup. Databases created before the LadybugDB 0.21 string-hash change still need the documented rebuild procedure. See the [storage and rollback guide](https://github.com/Kehl-io/nestweaver/blob/v12.2.5/docs/guide/publication-rebuild.md#ladybugdb-022-storage-format-and-rollback).

## What changed

- Indexing recovers stale resolver inputs on watcher restart and improves PHP static-method ownership and Dart and PowerShell parsing.
- Server mode improves authentication, repository polling, replica reads, and federated result identity.
- The web and MCP interfaces better protect vault reads and preserve search truncation and session behavior.

See the [complete v12.2.5 release notes](https://github.com/Kehl-io/nestweaver/releases/tag/v12.2.5). After installation, [verify agent activation](/integrations/verification/).
