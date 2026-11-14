# RBAC 4.0 Migration — Execution Record

## Objective and status

Deliver `@rbac/core@4.0.0` with a single-options `createRBAC` factory, independently installable integrations, zero runtime dependencies in the core, complete v4 bilingual documentation, and validated npm artifacts. Preserve authorization semantics and all historical documentation/releases.

- Current state: v4 migration is on `master`; all six `@rbac/*@4.0.0` packages are published on npm. The subsequent security and branding changes are being prepared as v4.0.1.
- Publishing status: `npm whoami` returned `phandrade` and `npm view` confirmed v4.0.0 on the registry for all six packages on 2026-11-14. The v4.0.1 tarballs are prepared locally but have not been published. Publication instructions are in `RELEASE_V4.md`.
- Source baseline: `src/`; target source layout decided per phase. Never edit generated `lib/` or historical website versions.

## Architecture decisions

1. Introduce npm workspaces with a self-contained `@rbac/core` package and narrow integration packages when they provide actual dependency isolation. Preserve one logical implementation of role mapping and permission evaluation.
2. Replace v3's `RBAC(config)(roles)` with `createRBAC({ roles, ...config })`. Use named exports; retire v3 compatibility aliases in v4. Keep `can`, `addRole`, and `updateRoles` semantics.
3. Keep the engine dependency-free. SQL/database drivers and frameworks remain optional peers or lazy-loaded modules in their own workspace packages; Zod belongs only to schemas.
4. Ensure CJS and ESM share identity via a CJS implementation and thin ESM facades; test the real packed package from consumers.
5. Create only v4/current website pages and translation updates, leaving historical versions intact except for the explicitly requested restoration of the missing 3.x archive from the pre-v4 Git snapshot.
6. Every completed and verified phase gets a Conventional Commit. Do not push, publish, deprecate, or tag without additional authorization.

## Phases

- [x] Inspect Git status, repository structure, existing public API, docs tooling and npm registry.
- [x] Create Gitflow local `develop` + `feature/rbac-v4` branches.
- [x] Record baseline tests and performance measurements.
- [x] Bootstrap migration tracking and session-resumption instructions; verify and commit.
- [x] Introduce workspaces, package metadata and reliable build, lint, typecheck and test scripts.
- [x] Implement `createRBAC`, `RBACEngine` and `RBACOptions` with correct generic inference and regression coverage.
- [x] Extract adapters, Express, Fastify, NestJS and Zod integrations without duplicating the core.
- [x] Validate tenant isolation, SQL identifier safety, prototype names, conditional OR, glob/regex behavior and cache bounds.
- [x] Verify CJS/ESM identity, package exports, type consumers and packed npm installations.
- [x] Compare post-migration benchmarks against measured v3 baseline and explain material changes.
- [x] Refresh README, CHANGELOG, examples and current Docusaurus EN/pt-BR docs, add v3 → v4 guide.
- [x] Update interactive playground, API generation, examples validation and package documentation.
- [x] Update CI and GitHub Pages build for the new structure.
- [x] Run full test, build, documentation and tarball verification; prepare release/deprecation commands (no execution).

## Validation log

- 2026-11-14: Node v22.14.0 and npm 10.9.2 available. Git tree clean before branch creation.
- 2026-11-14 baseline: `npm run build` passed; `npm test -- --coverage=false` passed with 6 suites/179 tests (Jest still collects coverage through its default config).
- `npm run bench:micro` baseline: RBAC exact stable **13,114,348 ops/s**, interpolated **3,336,184 ops/s**; `Set.has` stable **13,896,559 ops/s**, interpolated **3,572,610 ops/s**. Node 22.14.0, Windows, single run; rerun after migration on the same host. Neither measurement represents other environments.
- V4 workspace phase: `npm run build`, `npm run lint`, `npm test -- --coverage=false` (7 suites/181 tests), `node test/package-exports.test.mjs`, and `tsc -p test/package-types/tsconfig.json` passed. Packed-tarball verification and website migration pending.
- V4 packing phase: `node scripts/test-packed.mjs` passed after correcting an isolated TypeScript fixture. All six packages were packed, installed as local tarballs into a clean temporary consumer, and validated for declared files, CJS/ESM exports, authorization, and NodeNext TypeScript declarations.
- V4 performance phase: `npm run bench:micro` returned exact stable **14,484,315 ops/s** (+10.4% vs single-run v3), interpolated **3,965,550 ops/s** (+18.9%), Set.has stable **15,140,917 ops/s** and interpolated **3,636,781 ops/s**. Same Windows host and Node 22.14.0; each version measured only once, so changes may reflect process/JIT/CPU variability. Full comparison `npm run bench` was updated for v4 but not rerun, as it generates tracked reports.
- V4 documentation phase: `npm run check:examples` in `website/` passed (45 standalone TypeScript samples, 2 JavaScript syntax samples); `npm run typecheck` passed. TypeDoc generation passes with a dedicated seven-entry-point project. `npm run check:translations` passed: 75 current pages and 88 total pages per locale (including historical 1.x/2.x). `npm run build` successfully produced English and pt-BR Docusaurus output, including both v3 → v4 migration routes. No historical 1.x/2.x documentation was changed.
- Final workspace verification (2026-11-14): `npm ci --no-audit --no-fund`, `npm run lint`, `npm run typecheck`, `npm test -- --coverage=false` (7 suites / 181 tests), `npm run test:package` (six real, isolated tarballs and CJS/ESM/NodeNext consumers), `npm run examples` and `npm pack --dry-run --workspaces` all passed. Jest still collects coverage via its config; reported source coverage is influenced by how built-package imports are instrumented and was not treated as an authorization assurance metric.
- Release preparation: documented publication order, registry checks, registry verification, migration instructions and the *unexecuted* old-package deprecation command in `RELEASE_V4.md`; expanded the `@rbac/core` npm README. After this README edit, `npm pack --dry-run --workspace=@rbac/core --json` confirmed README.md (2,143 bytes), MIGRATION.md (888 bytes), and 85 files inside the package.
- CI preparation: both `.github/workflows/ci.yml` and `.circleci/config.yml` parsed as YAML with the expected jobs. The GitHub Pages validation job includes root workspace checks, the bilingual docs build, and verification of 16 generated static routes; the `deploy` job remains restricted to `master`. All 16 route paths existed in the locally generated website build.

## Commits and next step

- Baseline tracking commit: `6fe4fd7`. Workspace/API/integration extraction: `77cb0e5`. Isolated tarball packaging: `bac23e7`. Performance comparison: `872d165`. Documentation/site: `e11a7c4`. Release preparation: `a81786f`. CI validation: `c507d3b`.
- Implementation and local verification complete on `feature/rbac-v4`. Next steps require separate authorization for any remote push, merge, publication or deprecation.

## Post-v4 performance optimization (2026-11-14)

- [x] Profile and optimize core unconditional permission checks while retaining conditional OR, cache invalidation, deny-by-default and logging behavior.
- [x] Extend security regressions for literal/glob/regex operations, cached patterns, role updates and thrown loggers.
- [x] Add the independently measured `bench:engine` suite with correctness checks; refine the 200-resource glob workload and stable operation inputs.
- [x] Refresh comparison JSON/CSV/HTML outputs and record engine results for Node 22.14.0, Windows 11 Pro, Intel i7-9700KF.
- [x] Publish measured tables, Mermaid `xychart-beta` charts and reproduction notes in README, benchmark methodology and bilingual current-v4 documentation. Historical versions untouched.

Benchmark snapshot: small exact 7,282,499 ops/s; 200-resource exact 7,086,106 ops/s; inherited 7,009,957 ops/s; glob 3,527,345 ops/s. Independent engine suite median: exact 11,821,309 ops/s; inherited 12,864,770 ops/s. These are environment-dependent, and comparator APIs are not all semantically equivalent.

Validation on 2026-11-14: `npm run bench` (both 15-case small and 18-case large suites), `node benchmarks/engine.js --json`, `npm run bench:micro` (stable exact 14,055,829 ops/s, interpolated 3,662,664 ops/s), `npm run lint`, `npm run typecheck`, `npm test -- --coverage=false` (7 suites, 185 tests), `npm run test:package` (six isolated tarballs, CJS/ESM/NodeNext), `npm run examples`, and `npm pack --dry-run --workspaces` passed. Website `npm run typecheck` and `npm run build` passed, including 76 localized current pages and both generated `/docs/benchmarks/` routes. Microbenchmarks vary between runs (the earlier v4 exact measurement was 14,484,315 ops/s). No release or push performed.

## Interactive playground update (2026-11-14)

- [x] Replace the JSON-only playground editor with a constrained JavaScript example parser that reads literal roles and one `await rbac.can()` check, then evaluates it through the playground's RBAC engine without executing arbitrary source.
- [x] Add the JavaScript editor mode and declare the parser/editor dependencies in the website workspace.

Validation: `website/npm run typecheck` and `website/npm run build` passed. The build checked examples and translations (76 current pages; 89 total pages per locale) and generated English and pt-BR static sites.

## Visual identity refresh (2026-11-14)

- Updated the root README and npm package README to display the complete RBAC SVG logo, and linked the shield-and-padlock SVG as a reusable brand asset.
- Updated Docusaurus favicon, navigation (including a white-wordmark variant for dark mode), homepage hero, social card, current EN/pt-BR introductions, and the site/playground accent palette to blue `#2563EB` and navy `#0F172A`.
- Preserved the authorization result colors as semantic feedback; existing historical documentation was left unchanged.
- Validation: root `npm run lint`, website `npm run typecheck` and `npm run build`, SVG XML parsing, generated EN/pt-BR route checks, and `git diff --check` passed. Additional bilingual brand-asset links in current introductions were validated by the subsequent bilingual website build.
- 2026-11-14 follow-up: synchronized the refreshed icon and full logo into the website's public assets; updated the lock details in the white-wordmark dark-navigation variant while preserving its light wordmark. Website build and `git diff --check` validated.

## Dependency security remediation (2026-11-14)

- [x] Update `@rbac/schemas` to patched Zod 4 and replace its `when` validator with a synchronous structural check compatible with Zod 4. Preserve all accepted condition shapes and reject malformed inputs without an exception.
- [x] Refresh root and website lockfiles and apply targeted transitive overrides for vulnerable packages. Remove the unused Mermaid ELK layout integration from the site.
- [x] Adapt TypeDoc's directory-walking `matchOne` call to `minimatch` 11 for generated current v4 API docs. Keep this compatibility shim until TypeDoc supports `minimatch` 11 natively.
- [x] Verify root and website `npm audit --json` report zero vulnerabilities locally (critical, high, moderate and low all zero).
- [x] Verify Node.js 22.14.0 workspace tests, packaging, examples, and bilingual website routes; include the separately prepared SVG/layout changes in the authorized commit.

Validation: `npm ci` (root), `npm run lint`, `npm run typecheck`, `npm test -- --coverage=false` (8 suites, 188 tests), `npm run test:package` (all six isolated package installations and CJS/ESM/NodeNext consumers), `npm run examples`, and `npm pack --dry-run --workspaces` passed. Website `npm run typecheck`, `npm run build`, `npm run check:examples` (45 TS and 2 JS examples), `npm run check:translations` (89 pages per locale) passed. The patch is limited to current v4 references; historical docs remain unchanged. No push, publication, or release tag performed.

## v4.0.1 npm patch release preparation (2026-11-14)

- [x] Verify all six v4.0.0 packages exist on npm, with authenticated account `phandrade` and the public npm registry configured.
- [x] Bump the six publishable workspaces to `4.0.1` and pin all five integrations to `@rbac/core@4.0.1`; synchronize the lockfile. The private root workspace was already `4.0.1`.
- [x] Update the tarball regression test to derive its expected version from the core manifest, and update the changelog and manual release checklist.
- [x] Run clean `npm ci` for root and website, `npm run lint`, `npm run typecheck`, `npm test -- --coverage=false` (8 suites / 188 tests), `npm run test:package` (six isolated CJS/ESM/NodeNext consumers), `npm run examples`, and `npm pack --dry-run --workspaces --json`.
- [x] Verify `npm audit --audit-level=low` reports zero vulnerabilities in both root and website dependency graphs.
- [x] Validate the website production build in English and pt-BR, including 76 current pages and 106 pages per locale across versions. The first run failed in pt-BR with an absent generated `__server/server.bundle.js` while the website's 3.x snapshot/configuration was being modified; the subsequent full run passed for both locales. No cause for the transient missing file was established.
- [x] Generate `dist/npm/rbac-{core,adapters,express,fastify,nestjs,schemas}-4.0.1.tgz`; inspect all embedded package manifests and validate `npm publish --dry-run --access public` for all six archives.
- [ ] Publish the v4.0.1 packages to npm, in dependency order, following explicit authorization and registry checks. No push, tag or package deprecation performed.

## Blockers and unresolved questions


- All six v4.0.0 packages are registered. Confirm permission and available version numbers again immediately before any v4.0.1 publication.
- npm publication, old-package deprecation, remote push and release tags require separate authorization.

## Historical 3.x documentation restoration (2026-11-14)

- [x] Restore 17 English and 17 pt-BR 3.x documentation pages from pre-v4 commit `a4aba71`, using `versioned_docs/version-3.x/` and its localized counterpart; reproduce the historical sidebar structure.
- [x] Register 3.x as a deprecated archived version while keeping 4.x as `current` / latest, and add CI checks for both 3.x introduction routes.
- [x] Correct outdated latest-version labels and an orphaned TypeDoc link in the archived API overview; link to the v3.0.0 source because the historical generated TypeDoc tree was not committed.
- [x] Validate `website/npm run typecheck`, `website/npm run build`, parity of 106 English/pt-BR pages, static 3.x introduction/installation/API/migration routes and 3.x selector links in both languages, and `git diff --check`. Existing 1.x/2.x snapshots remain untouched.
- The restored 3.x snapshot is committed in `c0c9e1f`, which matches `origin/master`; the live GitHub Pages deployment was not checked in this phase.

## Post-commit security and v4.0.1 validation (2026-11-14)

- Confirmed the local and remote `master` pointed to `c0c9e1f` before this verification update, with a clean Git working tree.
- Authenticated GitHub API checks on the repository's default `master` branch returned **zero open Dependabot alerts**, **zero open code-scanning alerts**, and **zero open secret-scanning alerts**. Dependabot's `dismissed` and `auto_dismissed` lists were also empty. Recent dependency findings (including Zod, minimatch, tinypool, glob, deepmerge and serialize-javascript) have `fixed` status; previously reported findings were resolved rather than dismissed.
- Fresh `npm audit --json` checks for both repository root and `website/` returned **zero vulnerabilities at every severity**.
- Revalidated on Node 22.14.0/npm 10.9.2: root lint and typecheck; Jest (8 suites, 188 tests); six isolated packaged CJS/ESM/NodeNext consumers; examples; and `npm pack --dry-run --workspaces --json`. Website typecheck and bilingual production build passed, with 45 TypeScript/2 JavaScript examples and 106 pages per language across documentation versions.
- Confirmed the six existing `dist/npm/*-4.0.1.tgz` SHA-256 values match those from the prior packaging phase. All six npm registry `latest` versions remain `4.0.0`; `4.0.1` has not been published. No push, tag or npm publication was performed as part of this validation.
- These checks cover known dependency alerts and currently reported GitHub code/secret scanning findings; they do not constitute a comprehensive manual security assessment of every possible application integration.

## v4.0.1 npm release candidate — final preparation (2026-11-14)

- [x] Re-check the public npm registry and authenticated publisher (`phandrade`): all six packages still have `4.0.0` as `latest`, and none has a published `4.0.1` version.
- [x] Verify release candidate at source commit `40ae396` (including the updated SVG brand assets), with a clean Git tree before recording this verification.
- [x] Run fresh `npm ci`, lint, typecheck, 8 Jest suites / 188 tests, packaged consumer tests across all six workspaces, examples, and `npm audit --audit-level=low` at the repository root. All passed; audit returned zero vulnerabilities.
- [x] Run fresh `npm ci`, typecheck, examples/translation checks, bilingual website production build, and audit in `website/`. All passed; 106 documentation pages per locale and zero audit vulnerabilities.
- [x] Rebuild all six `4.0.1` tarballs into ignored `dist/npm/`, record their SHA-256 hashes in `dist/npm/SHA256SUMS.txt`, and pass `npm publish --dry-run --access public --json` on each archive.
- [ ] Publish the six packages in dependency order from `RELEASE_V4.md` after final release authorization; verify npm registry metadata and installability afterward. No actual publication, deprecation or release tag in this preparation phase.

## npm package release tags (2026-11-14)

- [x] Confirm all six `@rbac/*@4.0.0` packages are present on the public npm registry and that source commit `6781750` contains the corresponding `4.0.0` package manifests.
- [x] Create six annotated **local** package-specific tags (`@rbac/{core,adapters,express,fastify,nestjs,schemas}@4.0.0`) pointing to `6781750`; retain the existing `v3.0.0` tag.
- [x] Document the version-checked tagging workflow for `4.0.1` in `RELEASE_V4.md` so tags are created only for packages actually published.
- [ ] Push the historical v4.0.0 tags to the remote when explicitly authorized. Publishing v4.0.1 to npm and creating its six tags remain pending.
