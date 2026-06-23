---
title: Instance Config
description: Configure NestWeaver with nestweaver-instance.toml — repos, cross-references, projects, and feature bundles.
sidebar:
  order: 1
---

NestWeaver's behavior is configured via `nestweaver-instance.toml`, which lives alongside the `.lbug` database file. This page covers the most common configuration options.

## Location

The instance config is created automatically when you run `nestweaver index` or `nestweaver setup`. By default, it lives at:

```
~/.local/share/nestweaver/<instance-name>/nestweaver-instance.toml
```

## Minimal example

```toml
[instance]
name = "my-project"

[[repos]]
path = "/path/to/my-repo"

[[repos]]
path = "/path/to/another-repo"
```

## Adding a knowledge vault

Link an Obsidian vault or markdown directory to the code graph:

```toml
[[brains]]
path = "/path/to/my-vault"
name = "project-notes"
```

## Cross-repo references

Define how repos reference each other (npm packages, imports, APIs):

```toml
[[links]]
from = "frontend"
to = "api-client"
kind = "npm"
```

## Full reference

See the annotated example config in the [NestWeaver repo](https://github.com/Kehl-io/nestweaver/tree/main/examples) for all available options including projects, feature bundles, embedding config, and MCP server settings.
