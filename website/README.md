# RBAC documentation site

This Docusaurus application publishes the RBAC guides, interactive playground and generated TypeScript API reference to GitHub Pages. The default locale is English; Brazilian Portuguese is available at `/pt-BR/`. The native documentation version dropdown includes **4.x (latest)**, **2.x** (based on npm 2.2.3) and **1.x** (based on npm 1.1.0). Historical majors show deprecation notices and migration guides.

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

The build typechecks each standalone TypeScript example in the root README and **current** English and Brazilian Portuguese guides against the real v4 workspace entry points. It also syntax-checks JavaScript and parses JSON examples, generates the current API pages with TypeDoc, checks documentation path parity for all versions and both locales, and builds both locales. Historical snippets are references to their respective npm artifacts and are not typechecked against v4 source. You can also run `npm run check:translations` after `npm run generate:api`.

## Where to edit

| Location | Contents |
| --- | --- |
| `docs/` | English guides; excludes generated `api/reference/` |
| `i18n/pt-BR/docusaurus-plugin-content-docs/current/` | Matching Portuguese guides |
| `versioned_docs/version-1.x/`, `versioned_docs/version-2.x/` | Frozen English guides and API snapshots for old majors |
| `i18n/pt-BR/docusaurus-plugin-content-docs/version-1.x/`, `version-2.x/` | Matching frozen Portuguese guides |
| `versions.json`, `versioned_sidebars/` | Native Docusaurus version registration and historical navigation |
| `sidebars.ts` | Documentation sidebar order |
| `src/pages/` | Landing page and playground |
| `src/css/custom.css` | Site and code-block styles |
| `scripts/generate-api.mjs` | TypeDoc generation from `../packages/*/src` |
| `scripts/check-translations.mjs` | Localized documentation path validation |
| `scripts/check-examples.mjs` | README and bilingual example validation |

Do not edit files under `docs/api/reference/` directly. They are regenerated on every build, including the matching pt-BR reference. API identifiers and source-code comments are preserved in English in both locales. Write hand-authored guides in both languages and keep examples aligned with the public exports of the major they document.

## Documentation version policy

Maintain **one documentation snapshot per published npm major**, using its final patch/minor release, rather than one snapshot for every individual release. Frozen website versions currently exist for 1.x (reference 1.1.0) and 2.x (reference 2.2.3). The 3.x (3.0.0) documentation was the unversioned `current` source before the v4 migration; it is retained in Git history but has no frozen Docusaurus snapshot. The maintained `current` website version is 4.x. Older version pages show a Docusaurus unmaintained banner and migration links. TypeDoc always documents `current`.

When publishing the next major, freeze the current documentation using Docusaurus versioning, add localized snapshots and matching sidebars, update `versions.json` and `docusaurus.config.ts`, change `lastVersion`, add migration guides in both languages, and keep GitHub Pages output and CI route checks aligned. Do not remove a previously published major's documentation. Use npm's release history to choose the final patch of each previous major.

Code fences are highlighted with Shiki (`@shikijs/rehype`) and styled for light and dark modes. Use fenced code blocks with a language tag (`ts`, `js`, `bash`, `json` or `sql`). Append `showLineNumbers` to display line numbers and `highlight={2,4-6}` to highlight specific lines (both options can be combined). Keep all examples executable wherever practical.
