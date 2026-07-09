# Contributing to NestWeaver Docs

Thank you for contributing! This guide covers both code and content contributions.

## Getting started

1. Fork the repository and clone your fork.
2. Create a feature branch: `git checkout -b feat/your-change`.
3. Install dependencies: `npm install`.
4. Start the dev server: `npm run dev`.

## Before submitting

Run the full check suite:

```bash
npm run lint && npm run type-check && npm run build
```

All three must pass before opening a PR.

## Pull requests

- PR titles must follow [conventional commits](https://www.conventionalcommits.org/) (enforced by CI). **The published site is the product**, so pick the type by what ships:
  - `feat:` — new or expanded site content (a new page, a new section, or docs for a new feature). Triggers a release and a production deploy.
  - `fix:` — corrections to existing site content. Triggers a patch release and deploy.
  - `docs:` — this repo's own repo-level docs only (`README.md`, `CONTRIBUTING.md`). Does **not** release or deploy — never use it for `src/content/docs/` pages, or they won't go live.
- CI runs lint, type-check, and build on all PRs.
- Releases — and the production Cloudflare deploy, which runs on `v*` tags — are automated via release-please, so only `feat:` / `fix:` changes reach the live site.

## Content contributions

### Adding a new page

Create a `.md` file in the appropriate `src/content/docs/<section>/` directory. Sidebar sections are auto-generated from the directory structure — no config changes needed.

### Required frontmatter

```yaml
---
title: Page Title
description: SEO-targeted description, under 155 characters.
sidebar:
  order: 3
---
```

- `title` — Page heading and browser title.
- `description` — Used in meta tags and search results. Keep under 155 characters.
- `sidebar.order` — Integer controlling page position within its section.

### Writing style

- **Answer-first** — Lead with a 2-3 sentence direct answer before details.
- **Entity consistency** — "NestWeaver" (capital N, capital W) in prose; `nestweaver` only in code blocks.
- **Code blocks** — Always include a language annotation (e.g. ` ```bash`, ` ```toml`).
- **Token efficiency tips** — Use the Starlight aside syntax:

```md
:::tip[Token efficiency]
Your tip here.
:::
```
