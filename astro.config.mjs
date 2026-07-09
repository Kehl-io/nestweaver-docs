import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://docs.nestweaver.kehl.io',
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    starlight({
      title: 'NestWeaver Docs',
      logo: {
        light: './src/assets/logo-horizontal-light.svg',
        dark: './src/assets/logo-horizontal-dark.svg',
        replacesTitle: true,
      },
      favicon: '/favicon-light.svg',
      head: [
        {
          tag: 'link',
          attrs: {
            rel: 'icon',
            href: '/favicon-light.svg',
            type: 'image/svg+xml',
          },
        },
        {
          tag: 'meta',
          attrs: {
            property: 'og:image',
            content: 'https://docs.nestweaver.kehl.io/og.png',
          },
        },
        {
          tag: 'meta',
          attrs: {
            name: 'twitter:image',
            content: 'https://docs.nestweaver.kehl.io/og.png',
          },
        },
      ],
      customCss: [
        '@fontsource-variable/inter',
        '@fontsource/michroma',
        '@fontsource-variable/jetbrains-mono',
        './src/styles/custom.css',
      ],
      components: {
        Head: './src/components/Head.astro',
        SiteTitle: './src/components/SiteTitle.astro',
        SocialIcons: './src/components/SocialIcons.astro',
      },
      sidebar: [
        {
          label: 'Getting Started',
          autogenerate: { directory: 'getting-started' },
        },
        {
          label: 'Core Concepts',
          autogenerate: { directory: 'concepts' },
        },
        {
          label: 'CLI Reference',
          autogenerate: { directory: 'cli' },
        },
        {
          label: 'Web UI',
          autogenerate: { directory: 'web-ui' },
        },
        {
          label: 'MCP Tools',
          autogenerate: { directory: 'mcp-tools' },
        },
        {
          label: 'Configuration',
          autogenerate: { directory: 'configuration' },
        },
        {
          label: 'Integrations',
          autogenerate: { directory: 'integrations' },
        },
        {
          label: 'Guides',
          autogenerate: { directory: 'guides' },
        },
      ],
    }),
  ],
});
