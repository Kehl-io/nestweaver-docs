---
title: Installation
description: How to install NestWeaver — via npm, Cargo, pre-built binaries, or the macOS app.
sidebar:
  order: 1
---

Install the CLI, then [index a repository](/getting-started/quick-start/). If you want the picture first, read [what NestWeaver is](/getting-started/overview/) or the [Web UI tour](/web-ui/).

## npm (recommended)

The quickest way to get started. No Rust toolchain needed.

```bash
npm install --global nestweaver
nestweaver --version
# Expected: nestweaver X.Y.Z
```

The package is [nestweaver on npm](https://www.npmjs.com/package/nestweaver).

## Cargo

There is no published crates.io package. From a source checkout, fetch the pinned Ladybug sources and install the local crate:

```bash
eval "$(scripts/fetch-lbug-source.sh)"
cargo install --locked --path .
nestweaver --version
```

## Pre-built binaries

Download a pre-built binary for your platform from [GitHub Releases](https://github.com/Kehl-io/nestweaver/releases/latest). Binaries are available for:

- **Linux** — x86_64 and aarch64
- **macOS** — x86_64 and aarch64

Extract and install:

```bash
tar xzf nestweaver-*.tar.gz
sudo mv nestweaver /usr/local/bin/
```

## macOS app

Build **NestWeaver.app** from source (it bundles Metal-accelerated embeddings and the web UI):

```bash
eval "$(scripts/fetch-lbug-source.sh)"
bash app/build.sh
open target/release/NestWeaver.app
```

Run these from the repository root. `app/build.sh` calls `cargo build` and does not fetch Ladybug itself. Without `LBUG_SOURCE_DIR` from `scripts/fetch-lbug-source.sh`, that Cargo build cannot compile the pinned database crate. The script writes the bundle to `target/release/NestWeaver.app` at the repo root. `cd app` first makes `open target/release/NestWeaver.app` look in the wrong directory.

The `.app` bundle includes a menubar status icon, Metal GPU acceleration for faster embeddings, automatic daemon lifecycle, a web UI on port 9377, and crash recovery.

## Verify installation

Confirm NestWeaver is installed and working:

```bash
nestweaver --version
# Expected: nestweaver X.Y.Z
```

Run `nestweaver --help` to see the full command list. `--json` is per command, not a global flag.

## Next steps

Head to the [Quick Start](/getting-started/quick-start/) to index your first codebase and configure your AI tools.
