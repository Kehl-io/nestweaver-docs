---
title: 12.2.3 release and upgrade
description: Release-hardening fixes, resolver generation 17, and the one-time repository and vault refresh procedure.
sidebar:
  order: 9
---

NestWeaver 12.2.3 hardens indexing, publication safety and graph correctness.
It keeps the existing 43 MCP tools and 32 supported languages.

## What changed

- **Go graph correctness:** receiver origins, typed and inferred slice ranges,
  factory-call chains and named returns retain package ownership. Recreated
  package members restore unchanged callers. Initializers and case bindings
  stop shadowing imports or outer receivers when their scope ends.
- **Publication and restore safety:** stronger database identity, admission and
  interrupted-restore ownership checks; existing live data is preserved when a
  restore cannot establish replacement authority.
- **Read and watch correctness:** unchanged Objective-C declarations can be read,
  configured file-URI vault roots are decoded, and selected source previews
  refresh after reindexing.
- **Embedding recovery:** an unavailable local model can recover even when every
  scoped node already has a stored vector. Existing vectors alone do not prove
  the model is usable.
- **Server and dependency hardening:** logged-in administrator device approvals
  are authenticated; crypto timing advisories are addressed.

The [complete changelog](https://github.com/Kehl-io/nestweaver/releases/tag/v12.2.3)
contains the commit-level detail.

## Upgrade an existing installation

```bash
npm install --global nestweaver@12.2.3
nestweaver --version
```

Verified release archives and source builds remain available through the
[installation guide](/getting-started/). Linux archives must retain their bundled
`lib/` directory. The macOS application remains source-build-only; this release
publishes CLI archives and npm platform packages, not an app bundle or DMG.

For a compatible database, re-index **every repository once** with `--force`,
then refresh **every registered vault once**. Keep the database and config
bindings used by that installation:

```bash
nestweaver index --repo /path/to/repo --db /path/to/nestweaver.lbug --force
nestweaver brain refresh /path/to/vault --db /path/to/nestweaver.lbug
nestweaver stale-check --db /path/to/nestweaver.lbug
```

Resolver generation is **17**, compared with **12** in 12.2.2; parsed cache is
**11**, compared with **8**. The cache invalidation does not replace the forced
index: unchanged repositories can otherwise keep old edges. A mismatched
resolver makes `stale-check` exit 2 and `dead-code` refuse stale results.
Vaults do not carry a code resolver generation and are refreshed separately.

New databases do not need this migration. Storage-format incompatibility is a
separate [publication rebuild](https://github.com/Kehl-io/nestweaver/blob/main/docs/guide/publication-rebuild.md#storage-engine-upgrade-ladybugdb-021-rebuild-required)
condition; a forced index alone does not repair it.

## Verification and limits

Check `nestweaver stale-check` after rebuilding, and inspect `nestweaver brain
status` for coverage, watcher and embedding warnings. These checks report their
own scope; they are not a guarantee that every language construct or native app
workflow is covered. June benchmark numbers on the marketing sites remain
historical measurements and have not been rerun for this release.
