# RBAC 4.0 Migration — Execution Record

## Objective and status

Deliver `@rbac/core@4.0.0` with a single-options `createRBAC` factory, independently installable integrations, zero runtime dependencies in the core, complete v4 bilingual documentation, and validated npm artifacts. Preserve authorization semantics and all historical documentation/releases.

- Current state: v3.0.0 is on `master`; migration is on `feature/rbac-v4`, based on local `develop` created from `master`.
- Publishing status: not authorized. `npm view @rbac/core` returned npm E404 on 2026-11-14 (name not found); `npm whoami` returned `phandrade`. The user confirmed ownership of the `@rbac` scope; publish permission for the unregistered name is untested and publication is not authorized. Manual release instructions are in `RELEASE_V4.md`.
- Source baseline: `src/`; target source layout decided per phase. Never edit generated `lib/` or historical website versions.

## Architecture decisions

1. Introduce npm workspaces with a self-contained `@rbac/core` package and narrow integration packages when they provide actual dependency isolation. Preserve one logical implementation of role mapping and permission evaluation.
2. Replace v3's `RBAC(config)(roles)` with `createRBAC({ roles, ...config })`. Use named exports; retire v3 compatibility aliases in v4. Keep `can`, `addRole`, and `updateRoles` semantics.
3. Keep the engine dependency-free. SQL/database drivers and frameworks remain optional peers or lazy-loaded modules in their own workspace packages; Zod belongs only to schemas.
4. Ensure CJS and ESM share identity via a CJS implementation and thin ESM facades; test the real packed package from consumers.
5. Create only v4/current website pages and translation updates, leaving `website/versioned_docs`, `versioned_sidebars` and prior-version translations intact.
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

## Blockers and unresolved questions

- `@rbac/core` appears unregistered, but an npm 404 is not proof that this account can publish to the `@rbac` scope. Verify registry rights at publication time; the user confirms ownership of `@rbac`.
- npm publication, old-package deprecation, remote push and release tags require separate authorization.
- The 3.x website guides were the unversioned `current` documentation before v4; no frozen 3.x Docusaurus snapshot existed. The user explicitly prohibited changes or regeneration of previous-major documentation, so existing 1.x/2.x snapshots were preserved and no new 3.x archive was generated. The former 3.x source remains available in Git history.
