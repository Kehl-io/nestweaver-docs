---
title: Installation
description: How to install NestWeaver — via npm, Cargo, pre-built binaries, or the macOS app.
sidebar:
  order: 1
---

NestWeaver can be installed several ways depending on your platform and preferences.

## npm (recommended)

The quickest way to get started. No Rust toolchain needed.

```bash
npm install -g @kehl-io/nestweaver
nestweaver --version
# Expected: nestweaver X.Y.Z
```

## Cargo

If you already have Rust 1.85+ installed:

```bash
cargo install nestweaver
nestweaver --version
# Expected: nestweaver X.Y.Z
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

Download **NestWeaver.app** from [GitHub Releases](https://github.com/Kehl-io/nestweaver/releases). The `.app` bundle includes a menubar status icon, Metal GPU acceleration for faster embeddings, automatic daemon lifecycle, a web UI on port 9377, and crash recovery.

## Verify installation

Confirm NestWeaver is installed and working:

```bash
nestweaver --version
# Expected: nestweaver X.Y.Z
```

Run `nestweaver --help` to see the full command list. All commands support `--json` for machine-readable output.

## Next steps

Head to the [Quick Start](/getting-started/quick-start/) to index your first codebase and configure your AI tools.
