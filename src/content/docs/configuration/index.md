---
title: Instance Config
description: Configure NestWeaver with nestweaver-instance.toml — repos, vaults, links, and feature bundles.
sidebar:
  order: 1
---

An instance config names the repos NestWeaver indexes, how they relate, and where snapshots and workspace checkouts live. `nestweaver index` and `nestweaver setup` do not create this file.

NestWeaver looks for it beside the repo as `.nestweaver/instance.toml`, `nestweaver-instance.toml`, or `instance.toml`. Pass `--config` when the file lives somewhere else. With neither `--instance` nor a config, commands use the instance id `default`.

The canonical minimal file in the NestWeaver repo is `examples/minimal-instance.toml`. Validate a copy before using it:

```sh
cp examples/minimal-instance.toml nestweaver-instance.toml
nestweaver config validate nestweaver-instance.toml
```

## Minimal example

`InstanceConfig` rejects unknown fields. These five settings are required:

```toml
instance_id = "my-project"

[snapshot_storage]
backend = "local"
path = "~/.local/share/nestweaver/my-project/snapshots"

[workspace]
backend = "local"
path = "~/.local/share/nestweaver/my-project/workspace"

[inference]
endpoint = "http://localhost:11434"
embedding_model = "nomic-embed-text"
summary_model = "qwen2.5-coder:7b"

[git]
credential_method = "gh"
```

## Repos and vaults

A repo entry needs `url`, not `path`. A markdown vault is the same table with `type = "vault"`.

```toml
[[repos]]
url = "https://github.com/example/frontend"
name = "frontend"

[[repos]]
url = "https://github.com/example/notes"
name = "project-notes"
type = "vault"
```

Indexing a checkout you already have is still `nestweaver index --repo ./frontend`. The `url` in config is the declared identity, not a substitute for `--repo`.

## Cross-repo links

Links use `type`, not `kind`.

```toml
[[links]]
from = "frontend"
to = "api-client"
type = "http-api"
description = "Frontend calls the API client"
```

## Full reference

The annotated guide in the NestWeaver repo is `docs/guide/instance-config.md`. It covers projects, feature bundles, embedding weights, and MCP server settings.
