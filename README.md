# NestWeaver Docs

Documentation site for NestWeaver — [docs.nestweaver.kehl.io](https://docs.nestweaver.kehl.io)

## Tech stack

Astro Starlight · Tailwind v4 · TypeScript · Pagefind search · Cloudflare Pages

## Prerequisites

- Node 24+

## Local development

```bash
npm install && npm run dev
```

## Build

```bash
npm run build
```

Outputs to `dist/`.

## Check suite

```bash
npm run lint && npm run type-check && npm run build
```

## Content

Docs live in `src/content/docs/` as Markdown files organized by section.

## Deployment

Automated via GitHub Actions — push to `main` triggers release-please, version tags trigger Cloudflare Pages deploy.

## Links

- [Live site](https://docs.nestweaver.kehl.io)
- [NestWeaver repo](https://github.com/Kehl-io/nestweaver)
- [Marketing site](https://nestweaver.kehl.io)

## License

[MIT](LICENSE)
