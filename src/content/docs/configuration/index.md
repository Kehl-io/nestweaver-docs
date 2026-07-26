---
title: Instance Config
description: Configure NestWeaver with nestweaver-instance.toml — repos, cross-references, projects, and feature bundles.
sidebar:
  order: 1
---

NestWeaver's behavior is configured via `nestweaver-instance.toml`. This page
covers the most common configuration options.

## Location

The config can live anywhere; indexing and setup do not create one
automatically. Pass its path explicitly with `--config` when starting the
daemon or running a command that needs it. A conventional location is:

```
~/.local/share/nestweaver/<instance-name>/nestweaver-instance.toml
```

Set the optional top-level `db` field when the config should also select the
database. Validate a config before using it:

```bash
nestweaver config validate /path/to/nestweaver-instance.toml --json
```

## Minimal example

```toml
instance_id = "my-project"
db = "/absolute/path/to/brain.lbug"

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

## Adding a knowledge vault

Link an Obsidian vault or markdown directory to the code graph:

```toml
[[repos]]
url = "https://github.com/myorg/docs"
name = "project-notes"
type = "vault"
```

## Cross-repo references

Define how repos reference each other (npm packages, imports, APIs):

```toml
[[links]]
from = "frontend"
to = "api-client"
type = "npm"
```

## Embedding and semantic retrieval

`[embedding]` is independent from `[inference]`. It selects one semantic
embedding backend, its local-device policy, model cache, and the retrieval
fusion weights:

```toml
[embedding]
model_id = "sentence-transformers/all-MiniLM-L6-v2"
cache_dir = "~/.cache/nestweaver/models"
accelerator = "auto" # auto | metal | cpu

# Optional authoritative external backend:
# external_endpoint = "https://api.openai.com"
# external_model = "text-embedding-3-small"

weight_ppr = 0.40
weight_bm25 = 0.25
weight_semantic = 0.35
always_blend_semantic = true
semantic_seed_limit = 5
semantic_search_limit = 200
```

The local device policies are exact:

| Value   | Behavior                                                                                                                                                                |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auto`  | Metal in a Metal-enabled build; CPU only when Metal is not compiled. A Metal failure is reported; `auto` does not retry on CPU.                                         |
| `metal` | Requires Metal to be compiled and both device creation and the full model inference probe to succeed. A failure leaves embedding state `failed`; CPU is never selected. |
| `cpu`   | Selects CPU directly and never probes Metal. Use this for an intentional CPU deployment or to opt out of Metal.                                                         |

An `external_endpoint` is authoritative. A load, readiness, or request failure
is reported and never invokes a local model.

### Model cache

Daemon startup is cache-only: it never contacts Hugging Face or downloads
missing model files. The daemon expands a configured leading `~/` against its
user's home directory.

To populate a new cache, stop the daemon (which owns the database write lock)
and run the direct local command. Its required form is
`nestweaver embed --db <path> --local --model-id <id> --cache-dir <path>`:

```bash
DB=/absolute/path/to/brain.lbug
CONFIG=/absolute/path/to/nestweaver-instance.toml
MODEL=sentence-transformers/all-MiniLM-L6-v2
CACHE="$HOME/.cache/nestweaver/models"
nestweaver daemon --db "$DB" stop
nestweaver embed --db "$DB" --local --model-id "$MODEL" --cache-dir "$CACHE"
nestweaver daemon --db "$DB" start --config "$CONFIG"
```

Do not omit `--local`: without it, `embed` routes to the configured cache-only
daemon and cannot download missing files. Use the same model ID and expanded
cache path in both the direct command and instance configuration.

### Switching from an external backend to a local model

Removing `external_endpoint` changes the configured backend, but existing
external model metadata and vectors still belong to the old backend. Stop the
daemon, remove `external_endpoint` from the config, and replace them with a
forced direct local embedding pass before restarting with the same config:

```bash
DB=/absolute/path/to/brain.lbug
CONFIG=/absolute/path/to/nestweaver-instance.toml
MODEL=sentence-transformers/all-MiniLM-L6-v2
CACHE="$HOME/.cache/nestweaver/models"
nestweaver daemon --db "$DB" stop
nestweaver embed --db "$DB" --local --model-id "$MODEL" --cache-dir "$CACHE" --force
nestweaver daemon --db "$DB" start --config "$CONFIG"
```

## Full reference

See the annotated example config in the [NestWeaver repo](https://github.com/Kehl-io/nestweaver/tree/main/examples) for all available options including projects, feature bundles, embedding config, and MCP server settings.
