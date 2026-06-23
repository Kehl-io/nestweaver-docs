# NestWeaver Docs — Agent Instructions

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint + Prettier check
npm run lint:fix     # ESLint + Prettier auto-fix
npm run format       # Prettier write
npm run type-check   # Astro check (TypeScript)
```

## Before every commit

```bash
npm run lint && npm run type-check && npm run build
```

## Architecture

Astro Starlight documentation site. Built-in Pagefind search, dark/light mode toggle, Shiki code highlighting.

## File structure

- `astro.config.mjs` — Starlight config: site URL, sidebar structure (6 sections), logo, custom CSS, component overrides
- `src/styles/custom.css` — Starlight CSS variable overrides for NestWeaver brand colors (dark: cobalt #5ed0fe accent, deep navy backgrounds; light: deep blue #0862a7 accent)
- `src/content/docs/` — All documentation content as Markdown files
  - `getting-started/` — Installation, Quick Start, Your First Query
  - `concepts/` — How the Graph Works, Token-Budget Extraction, Personalized PageRank, Daemon Architecture
  - `cli/` — CLI Overview, Indexing & Watch, Context & Search, Impact & Analysis, Brain Commands, Multi-Repo & Projects
  - `mcp-tools/` — Overview & Setup, Context Tools, Code Navigation, Impact Analysis, Vault & Notes
  - `configuration/` — Instance Config, Language Support, AI Tool Integrations
  - `guides/` — Token-Efficient Workflows, Monorepo Setup, Brain + Obsidian Vault, CI Integration
- `src/components/` — Custom Starlight component overrides: Head.astro (BreadcrumbList structured data), SiteTitle.astro (logo links to nestweaver.kehl.io), SocialIcons.astro (GitHub link)
- `src/assets/` — NestWeaver logo SVGs (horizontal dark/light variants)
- `src/content.config.ts` — Starlight content collection config

## Adding/editing docs

Create a `.md` file in the appropriate `src/content/docs/<section>/` directory. Frontmatter requires `title`, `description`, and `sidebar.order`. Use `sidebar.order` to control page ordering within a section.

Sidebar sections are auto-generated from directory structure via `autogenerate` in `astro.config.mjs`. Adding a new page to an existing section only requires creating the file — no config changes needed.

## Conventions

- "NestWeaver" (capital N, capital W) in prose; `nestweaver` only in code blocks.
- Answer-first writing style.
- Code blocks must have language annotations.
- Token efficiency tips use `:::tip[Token efficiency]` Starlight asides.
