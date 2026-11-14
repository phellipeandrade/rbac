# RBAC documentation site

This Docusaurus application publishes the RBAC guides, interactive playground and generated TypeScript API reference to GitHub Pages. The default locale is English; Brazilian Portuguese is available at `/pt-BR/`.

## Local development

Use Node.js 22.14.0 or later (minimum 22.12.0). First run `npm ci` in the repository root to install the library's development dependencies; then from `website/`:

```bash
npm ci
npm start
```

`npm start` regenerates the TypeDoc reference, then starts Docusaurus. From the same directory, verify a change with:

```bash
npm run typecheck
npm run check:examples
npm run build
```

The build typechecks each standalone TypeScript example in the root README, English and Brazilian Portuguese guides against the real source entry points. It also syntax-checks JavaScript and parses JSON examples, generates API pages with TypeDoc, checks that documentation pages have equivalent paths in English and Portuguese, and builds both locales. You can also run `npm run check:translations` after `npm run generate:api`.

## Where to edit

| Location | Contents |
| --- | --- |
| `docs/` | English guides; excludes generated `api/reference/` |
| `i18n/pt-BR/docusaurus-plugin-content-docs/current/` | Matching Portuguese guides |
| `sidebars.ts` | Documentation sidebar order |
| `src/pages/` | Landing page and playground |
| `src/css/custom.css` | Site and code-block styles |
| `scripts/generate-api.mjs` | TypeDoc generation from `../src` |
| `scripts/check-translations.mjs` | Localized documentation path validation |
| `scripts/check-examples.mjs` | README and bilingual example validation |

Do not edit files under `docs/api/reference/` directly. They are regenerated on every build, including the matching pt-BR reference. API identifiers and source-code comments are preserved in English in both locales. Write hand-authored guides in both languages and keep examples aligned with the actual public exports.

Code fences are highlighted with Shiki (`@shikijs/rehype`) and styled for light and dark modes. Use fenced code blocks with a language tag (`ts`, `js`, `bash`, `json` or `sql`). Append `showLineNumbers` to display line numbers and `highlight={2,4-6}` to highlight specific lines (both options can be combined). Keep all examples executable wherever practical.
