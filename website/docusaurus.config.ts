import type {Config} from '@docusaurus/types';
import type {Options as ClassicOptions} from '@docusaurus/preset-classic';
import path from 'node:path';
import {createRequire} from 'node:module';
import rehypeShiki from '@shikijs/rehype';
import type {ShikiTransformer} from 'shiki';

const require = createRequire(import.meta.url);

const config: Config = {
  title: 'RBAC',
  tagline: 'Authorization, made understandable.',
  favicon: 'img/rbac-icon.svg',
  url: 'https://phellipeandrade.github.io',
  baseUrl: '/rbac/',
  organizationName: 'phellipeandrade',
  projectName: 'rbac',
  trailingSlash: true,
  onBrokenLinks: 'throw',
  onDuplicateRoutes: 'throw',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'pt-BR'],
    localeConfigs: {en: {label: 'English'}, 'pt-BR': {label: 'Português (Brasil)'}}
  },
  themes: ['@docusaurus/theme-mermaid'],
  markdown: {mermaid: true},
  plugins: [
    function tailwindPlugin() {
      return {
        name: 'rbac-tailwind',
        configurePostCss(options: {plugins: unknown[]}) {
          options.plugins.push(require('tailwindcss')({config: path.resolve('tailwind.config.cjs')}));
          options.plugins.push(require('autoprefixer'));
          return options;
        },
        configureWebpack() {
          return {resolve: {alias: {'@rbac-engine': path.resolve('../packages/core/src/index.ts')}}};
        }
      };
    },
    ['@easyops-cn/docusaurus-search-local', {hashed: true, indexDocs: true, indexBlog: false, language: ['en', 'pt'], docsRouteBasePath: 'docs'}]
  ],
  presets: [
    ['classic', {
      docs: {
        sidebarPath: './sidebars.ts',
        routeBasePath: 'docs',
        lastVersion: 'current',
        versions: {
          current: {label: '4.x (latest)', banner: 'none'},
          '2.x': {label: '2.x (deprecated)', banner: 'unmaintained', noIndex: true},
          '1.x': {label: '1.x (deprecated)', banner: 'unmaintained', noIndex: true}
        },
        editUrl: 'https://github.com/phellipeandrade/rbac/tree/master/website/',
        rehypePlugins: [[rehypeShiki, {
          themes: {light: 'github-light', dark: 'github-dark'},
          langs: ['typescript', 'tsx', 'javascript', 'jsx', 'json', 'bash', 'shell', 'sql', 'text'],
          defaultLanguage: 'text',
          addLanguageClass: true,
          transformers: [{
            name: 'rbac:code-metadata',
            pre(node) {
              const meta = this.options.meta?.__raw;
              if (typeof meta === 'string' && meta) node.properties['data-meta'] = meta;
            },
            line(node, lineNumber) {
              const meta = this.options.meta?.__raw;
              const selection = /(?:^|\s)highlight=\{([\d,\s-]+)\}/.exec(meta ?? '')?.[1];
              if (!selection) return;

              const highlighted = selection.split(',').some(range => {
                const match = /^(\d+)(?:-(\d+))?$/.exec(range.trim());
                if (!match) return false;
                const start = Number(match[1]);
                const end = Number(match[2] ?? match[1]);
                return lineNumber >= start && lineNumber <= end;
              });
              if (highlighted) {
                const classes = node.properties.className;
                node.properties.className = [...(Array.isArray(classes) ? classes : []), 'highlighted'];
              }
            }
          } satisfies ShikiTransformer]
        }]]
      },
      blog: false,
      theme: {customCss: './src/css/custom.css'},
      sitemap: {changefreq: 'weekly', priority: 0.5}
    } satisfies ClassicOptions]
  ],
  themeConfig: {
    image: 'img/social-card.svg',
    colorMode: {defaultMode: 'dark', disableSwitch: false, respectPrefersColorScheme: true},
    navbar: {
      logo: {alt: 'RBAC', src: 'img/rbac-logo.svg', srcDark: 'img/rbac-logo-dark.svg'},
      items: [
        {type: 'docSidebar', sidebarId: 'guide', position: 'left', label: 'Guides'},
        {to: '/playground', label: 'Playground', position: 'left'},
        {type: 'docSidebar', sidebarId: 'api', position: 'left', label: 'API'},
        {type: 'docsVersionDropdown', position: 'left'},
        {href: 'https://github.com/phellipeandrade/rbac', label: 'GitHub', position: 'right'},
        {type: 'localeDropdown', position: 'right'},
        {type: 'search', position: 'right'}
      ]
    },
    footer: {
      style: 'dark',
      links: [
        {title: 'Learn', items: [{label: 'Documentation', to: '/docs/intro'}, {label: 'Interactive playground', to: '/playground'}, {label: 'API reference', to: '/docs/api'}]},
        {title: 'Community', items: [{label: 'GitHub', href: 'https://github.com/phellipeandrade/rbac'}, {label: 'Contribute', href: 'https://github.com/phellipeandrade/rbac/blob/master/CONTRIBUTING.md'}, {label: 'Issues', href: 'https://github.com/phellipeandrade/rbac/issues'}]}
      ],
      copyright: `© ${new Date().getFullYear()} RBAC contributors · MIT License`
    }
  }
};

export default config;
