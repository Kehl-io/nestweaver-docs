---
title: CI Integration
description: Run NestWeaver in CI for impact analysis, affected-test selection, and dead-code review.
sidebar:
  order: 4
---

NestWeaver can run in CI for dead-code review, pull-request impact, and affected-test selection. Published commands use the same daemon route as a local shell. Do not pass `--no-daemon` and do not set `NESTWEAVER_NO_DAEMON`. That flag exists only inside unpublished CI tests and is ignored everywhere else.

## Install

npm is the shortest install:

```yaml
- name: Install NestWeaver
  run: npm install --global nestweaver
```

Release archives are named `nestweaver-<tag>-<target>.tar.gz`, with a matching `.sha256` file. The Linux x86_64 target is `x86_64-unknown-linux-gnu`.

```yaml
- name: Install NestWeaver
  run: |
    tag="v12.0.0"
    target="x86_64-unknown-linux-gnu"
    file="nestweaver-${tag}-${target}.tar.gz"
    curl -fsSL -o "$file" "https://github.com/Kehl-io/nestweaver/releases/download/${tag}/${file}"
    curl -fsSL -o "${file}.sha256" "https://github.com/Kehl-io/nestweaver/releases/download/${tag}/${file}.sha256"
    shasum -a 256 -c "${file}.sha256"
    tar xzf "$file"
    sudo mv nestweaver /usr/local/bin/
```

Use the tag of the release you intend to run. `cargo install nestweaver` is not a published crates.io package.

## Index in CI

`index` takes `--repo`. A bare `nestweaver index .` is rejected.

```bash
nestweaver index --repo . --db ./nestweaver.lbug
```

For more than one repo, point each `--repo` at the same database:

```bash
nestweaver index --repo ./frontend --db ./nestweaver.lbug
nestweaver index --repo ./backend --db ./nestweaver.lbug
```

## Useful CI checks

### Dead-code review

`dead-code` lists symbols no entry point reaches. Every tier is a review candidate, not a deletion list. Exit 0 means a review was produced. Exit 2 means the run was refused (a stale resolver, or an invalid page), not that dead code exists. Read the JSON review list. Do not fail the build on a non-zero exit.

```bash
nestweaver dead-code --db ./nestweaver.lbug --json
```

### PR impact

`pr-impact` scores changed files as **Low**, **Medium**, **High**, or **Unknown**. `Unknown` means the change was not assessed. Do not treat it as Low, and there is no Critical band.

With neither `--files` nor `--base`, the command runs `git diff --name-only` against the working tree. A clean checkout has no uncommitted diff, so the assessment is empty. Pass a merge-base SHA so the diff is the PR's changes. `--base` still includes uncommitted edits when any exist; a merge-base SHA keeps those out of a clean Actions checkout.

```bash
base="$(git merge-base "$BASE_SHA" HEAD)"
nestweaver pr-impact --base "$base" --db ./nestweaver.lbug
```

### Affected tests

Pass the files that changed, or a git ref. The JSON object has `tier_1`, `tier_2`, and `tier_3`. Each entry's path is `test_file`. "No tests found" is not safe-to-skip: the selection misses reflection, codegen, and data-driven tests.

```bash
nestweaver affected-tests --base-ref main --db ./nestweaver.lbug --json \
  | jq -r '.tier_1[].test_file, .tier_2[].test_file, .tier_3[].test_file'
```

## Snapshots

`index` starts the daemon. `snapshot build` copies the database file and refuses while that daemon, or a standalone watcher, is still writing it. Stop the daemon first.

Build writes next to the database as `snapshot-<instance>` unless you pass `--output`. Push does not read that directory on its own. With `--config` and no `--snapshot-dir`, push looks in the user data directory at `nestweaver/<instance-id>/snapshot`. Pass the same path to both.

`snapshot push` has no `--db` flag. `nestweaver pull` clones a repository URL. It does not restore a snapshot. Restoring a published snapshot is `nestweaver instance pull <instance-id>`.

```bash
nestweaver daemon stop
nestweaver snapshot build --db ./nestweaver.lbug --output ./snapshot-my-project
nestweaver snapshot push --config ./nestweaver-instance.toml --snapshot-dir ./snapshot-my-project
```

`[snapshot_storage]` has `backend`, `path`, `bucket`, `region`, and `project_id`. It has no `prefix` field.

```toml
[snapshot_storage]
backend = "s3"
bucket = "my-nestweaver-snapshots"
region = "us-east-1"
```

## Example GitHub Actions workflow

```yaml
name: NestWeaver Analysis
on:
  pull_request:
    branches: [main]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Install NestWeaver
        run: npm install --global nestweaver

      - name: Index repository
        run: nestweaver index --repo . --db ./nestweaver.lbug

      - name: Dead-code review
        run: nestweaver dead-code --db ./nestweaver.lbug --json

      - name: PR impact
        run: |
          base="$(git merge-base "${{ github.event.pull_request.base.sha }}" HEAD)"
          nestweaver pr-impact --base "$base" --db ./nestweaver.lbug
```

`fetch-depth: 0` is what makes that merge-base resolve. Co-change mining reads the same history.
