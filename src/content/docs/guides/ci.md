---
title: CI Integration
description: Run NestWeaver in CI pipelines for automated impact analysis, change detection, and documentation validation.
sidebar:
  order: 4
---

NestWeaver runs in CI pipelines for automated dead code detection, PR impact analysis, and test selection. The key difference from local usage is that CI runners don't persist daemon processes, so you need `--no-daemon` mode for all commands.

## CI mode

Pass `--no-daemon` to any command, or set the environment variable. This makes NestWeaver operate directly on the database file without starting a background daemon:

```bash
# Flag
nestweaver index . --no-daemon --db ./nestweaver.lbug

# Or environment variable (applies to all commands)
export NESTWEAVER_NO_DAEMON=1
nestweaver index . --db ./nestweaver.lbug
```

:::tip
Always use `--no-daemon` in CI. Without it, NestWeaver tries to start a background daemon that will be orphaned when the CI runner exits.
:::

## Pre-built binaries

Download a pre-built binary from [GitHub Releases](https://github.com/Kehl-io/nestweaver/releases). Binaries are available for Linux and macOS on both x86_64 and aarch64.

In GitHub Actions, add a setup step:

```yaml
- name: Install NestWeaver
  run: |
    curl -fsSL https://github.com/Kehl-io/nestweaver/releases/latest/download/nestweaver-linux-x86_64.tar.gz \
      | tar xz -C /usr/local/bin
    nestweaver --version
```

You can also install via npm if you prefer:

```yaml
- name: Install NestWeaver
  run: npm install -g @kehl-io/nestweaver
```

## Index in CI

Index the repository into a database file. For monorepos or multi-repo setups, index each repo into the same database:

```bash
nestweaver index . --no-daemon --db ./nestweaver.lbug
```

For multi-repo projects:

```bash
nestweaver index --repo ./frontend --no-daemon --db ./nestweaver.lbug
nestweaver index --repo ./backend --no-daemon --db ./nestweaver.lbug
```

## Useful CI checks

### Dead code detection

Fail the build when unreachable symbols are detected. NestWeaver traces reachability from entry points (exports, main functions, route handlers) and reports symbols that nothing calls:

```bash
nestweaver dead-code --no-daemon --db ./nestweaver.lbug
```

Use this as a quality gate — if dead code is found, the command exits with a non-zero status.

### PR impact analysis

Annotate pull requests with a blast radius showing which symbols, files, and tests are affected by the changes. Impact scores decay multiplicatively through edges so low-confidence paths are pruned:

```bash
nestweaver pr-impact --no-daemon --db ./nestweaver.lbug
```

This outputs a risk-scored summary (Low/Medium/High/Critical) that can be posted as a PR comment.

### Affected test selection

Run only the tests affected by changed files instead of the full suite. NestWeaver traces the dependency graph from changed symbols to their test files:

```bash
nestweaver affected-tests --no-daemon --db ./nestweaver.lbug
```

Pipe the output into your test runner to skip unaffected tests and speed up CI:

```bash
nestweaver affected-tests --no-daemon --db ./nestweaver.lbug --json \
  | jq -r '.affected_tests[]' \
  | xargs pytest
```

## Snapshots for speed

Re-indexing a large codebase on every CI run is slow. Snapshots let you build the graph once, push it to storage, and pull it in CI — skipping the index step entirely.

**Build and push a snapshot** (run after indexing, e.g., on main branch merges):

```bash
nestweaver snapshot build --no-daemon --db ./nestweaver.lbug
nestweaver snapshot push --no-daemon --db ./nestweaver.lbug
```

**Pull the snapshot in CI** (replaces the index step):

```bash
nestweaver pull --no-daemon --db ./nestweaver.lbug
```

Configure the snapshot storage backend in your instance config:

```toml
[snapshot_storage]
backend = "s3"
bucket = "my-nestweaver-snapshots"
prefix = "ci/"
```

## Example GitHub Actions workflow

A complete workflow that installs NestWeaver, indexes the repo, checks for dead code, and posts PR impact analysis:

```yaml
name: NestWeaver Analysis
on:
  pull_request:
    branches: [main]

env:
  NESTWEAVER_NO_DAEMON: '1'

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Full history needed for pr-impact

      - name: Install NestWeaver
        run: |
          curl -fsSL https://github.com/Kehl-io/nestweaver/releases/latest/download/nestweaver-linux-x86_64.tar.gz \
            | tar xz -C /usr/local/bin

      - name: Index repository
        run: nestweaver index . --db ./nestweaver.lbug

      - name: Dead code check
        run: nestweaver dead-code --db ./nestweaver.lbug

      - name: PR impact analysis
        run: nestweaver pr-impact --db ./nestweaver.lbug
```

:::tip
Add `fetch-depth: 0` to your checkout step. NestWeaver needs git history for `pr-impact` to compare the PR branch against the base branch, and for co-change mining.
:::

For projects using snapshots, replace the index step with a pull:

```yaml
- name: Pull snapshot
  run: nestweaver pull --db ./nestweaver.lbug

- name: Incremental re-index (changed files only)
  run: nestweaver index . --db ./nestweaver.lbug
```

This keeps CI fast — the snapshot provides the baseline graph and the incremental index picks up changes from the PR.
