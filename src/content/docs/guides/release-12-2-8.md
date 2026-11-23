---
title: 12.2.8 release and upgrade
description: Back up before installing, force-index repositories for resolver generation 24, and verify Markdown derivation 4.
sidebar:
  order: 8
---

NestWeaver 12.2.8 repairs parser coverage and Rust module call resolution, reduces repeated source parsing, and improves Markdown frontmatter and link extraction. Existing graphs need one forced repository re-index for resolver generation **24** and parsed cache **18**. The previous release used 23/17.

LadybugDB **0.22.3** remains on storage format **49**. Older installations crossing into LadybugDB 0.22 can migrate format 47 to 49 on writable open. Preserve the previous binary and pre-upgrade backup.

## Upgrade an existing database

1. Stop the old daemon. If a service manager runs it, stop the service so it cannot restart during the backup or installation.
2. With the **previous** binary, save a backup outside the database and publication directories. Keep the old binary and the same database and config bindings:

   ```sh
   nestweaver backup save /path/to/backup-before-12-2-8.nwsnap.zst --db /path/to/nestweaver.lbug --config /path/to/instance.toml
   ```

3. Install the pinned release, then check the executable version:

   ```sh
   npm install --global nestweaver@12.2.8
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

   Markdown derivation version **4** updates eligible vaults when the daemon starts. If a vault still reports stale derivation, refresh it with the same bindings:

   ```sh
   nestweaver brain refresh /path/to/vault --db /path/to/nestweaver.lbug --config /path/to/instance.toml
   ```

   This refresh repairs CRLF frontmatter parsing and extracts links and tags from Markdown prose while ignoring code, HTML comments, and math. It also incorporates the earlier encoded path, frontmatter wikilink, and block reference fixes.

5. Reconnect agent clients and [verify real tool discovery and known-symbol queries](/integrations/verification/). A successful CLI command or written registration file alone does not establish MCP activation.

New databases do not need a migration. Existing databases from before the LadybugDB 0.21 string-hash change still require the documented [publication rebuild procedure](https://github.com/Kehl-io/nestweaver/blob/v12.2.8/docs/guide/publication-rebuild.md#storage-engine-upgrade-ladybugdb-021-rebuild-required).

## Rollback

Keep the pre-upgrade backup even when moving from 12.2.7. To return to the saved state, reinstall the previous binary and restore that backup using its documented restore procedure. For older engines crossing the 47→49 storage boundary, a database or publication predecessor already opened writable by the new engine cannot replace the old-binary backup. See the [storage and rollback guide](https://github.com/Kehl-io/nestweaver/blob/v12.2.8/docs/guide/publication-rebuild.md#ladybugdb-022-storage-format-and-rollback).

## What changed

- Pascal and SystemVerilog declaration spans and Objective-C and SQL symbol capture improve. SQLite trigger grammar failures now report partial coverage while keeping recovered symbols available.
- Rust module paths and conventional Cargo crate aliases resolve more call edges. Rust symbol UIDs stay stable.
- Parser work for Rust pointer types and nested macros reuses lexical information. Inline symbol excerpts share source reads.
- Note indexing recognizes frontmatter with CRLF line endings and extracts links and tags from Markdown prose.

See the [complete v12.2.8 release notes](https://github.com/Kehl-io/nestweaver/releases/tag/v12.2.8).
