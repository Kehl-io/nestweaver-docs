---
title: Installation
description: Install a verified NestWeaver release, build the CLI from source, or build the macOS app.
sidebar:
  order: 1
---

## Pre-built CLI (recommended)

Download the archive and matching `.sha256` file for your platform from
[GitHub Releases](https://github.com/Kehl-io/nestweaver/releases/latest):

- Linux: `x86_64-unknown-linux-gnu` or `aarch64-unknown-linux-gnu`
- macOS: `x86_64-apple-darwin` or `aarch64-apple-darwin`

```bash
ARCHIVE=nestweaver-<tag>-<target>.tar.gz
shasum -a 256 -c "$ARCHIVE.sha256"
tar xzf "$ARCHIVE"
sudo install -m 0755 nestweaver /usr/local/bin/nestweaver
```

On Linux, use `sha256sum -c "$ARCHIVE.sha256"` if `shasum` is unavailable.

## Build the CLI from source

Install Rust 1.85 or newer, then build and install the checked-out source:

```bash
git clone https://github.com/Kehl-io/nestweaver.git
cd nestweaver
cargo install --locked --path .
```

To compile the local Metal backend on macOS:

```bash
cargo install --locked --path . --features metal
```

## macOS app

The native app is currently source-only; GitHub Releases do not publish an
`.app` bundle or DMG. From the repository root, build **NestWeaver.app** with
the bundled CLI, Metal embeddings, and web UI:

```bash
bash app/build.sh
open target/release/NestWeaver.app
```

The `.app` bundle includes a menubar status icon, Metal GPU acceleration for faster embeddings, automatic daemon lifecycle, a web UI on port 9377, and crash recovery.

## Verify installation

Confirm NestWeaver is installed and working:

```bash
nestweaver --version
# Expected: nestweaver X.Y.Z
```

Run `nestweaver --help` to see the full command list and each subcommand's
available output options.

## Next steps

Head to the [Quick Start](/getting-started/quick-start/) to index your first codebase and configure your AI tools.
