# RBAC v4.0.1 — Patch release checklist

This file prepares the v4.0.1 patch release following the published v4.0.0 packages. **No npm publication, deprecation, push, Git tag, or GitHub Pages deployment is performed by these instructions automatically.** Run the release commands only after approving the release and confirming that the documentation and source changes are merged.

## Packages and dependency order

The repository root is a private npm workspace and must not be published. All six public packages use version `4.0.1`; the five integration packages require `@rbac/core@4.0.1` exactly:

| Publish order | Package | Runtime dependencies |
| --- | --- | --- |
| 1 | `@rbac/core` | None |
| 2 | `@rbac/adapters` | `@rbac/core` |
| 3 | `@rbac/express` | `@rbac/core` |
| 4 | `@rbac/fastify` | `@rbac/core` |
| 5 | `@rbac/nestjs` | `@rbac/core` |
| 6 | `@rbac/schemas` | `@rbac/core` and Zod |

## Final verification

Use Node.js 22.14.0 (minimum supported version 22.12.0) and run from the repository root:

```bash
npm ci
npm run lint
npm run typecheck
npm test -- --coverage=false
npm run test:package
npm run examples
npm pack --dry-run --workspaces
npm audit --audit-level=low

cd website
npm ci
npm run typecheck
npm run build
npm audit --audit-level=low
```

`npm run test:package` checks six **real npm tarballs** installed in an isolated consumer, including CommonJS, ESM, shared module identity, types, and optional integration boundaries. Inspect each package's README, `MIGRATION.md`, export map, dependencies, and npm tarball contents.

From the repository root, generate the six **release artifacts** and keep them outside version control:

```bash
mkdir -p dist/npm
npm pack --workspaces --pack-destination dist/npm
```

Verify all six archives use the `4.0.1` version and match the source manifests. Only release the archives that passed the isolated consumer checks.

## Registry preparation

The operator has confirmed ownership of the `@rbac` scope. Before release, verify the *publishing account* and registry configuration independently:

```bash
npm whoami
npm config get registry
npm view @rbac/core version
npm view @rbac/rbac version
```

The first publication of a new scoped package may return `E404` for `npm view`; this only confirms the package name is absent, not that the current account has publishing rights. Complete npm account security checks and any required two-factor or granular-token authorization before publishing.

## Publication (manual; not executed)

After the code, migration guide, and site are reviewed and approved, publish the new packages from the repository root in dependency order:

```bash
npm run build
npm publish dist/npm/rbac-core-4.0.1.tgz --access public
npm publish dist/npm/rbac-adapters-4.0.1.tgz --access public
npm publish dist/npm/rbac-express-4.0.1.tgz --access public
npm publish dist/npm/rbac-fastify-4.0.1.tgz --access public
npm publish dist/npm/rbac-nestjs-4.0.1.tgz --access public
npm publish dist/npm/rbac-schemas-4.0.1.tgz --access public
```

Check the published registry metadata and install each package in a clean consumer. Do not publish the private root workspace. Each package's `prepack` script requires an up-to-date build.

```bash
npm view @rbac/core@4.0.1 version exports dependencies --json
npm view @rbac/adapters@4.0.1 version dependencies peerDependencies --json
npm view @rbac/express@4.0.1 version dependencies --json
npm view @rbac/fastify@4.0.1 version dependencies --json
npm view @rbac/nestjs@4.0.1 version dependencies --json
npm view @rbac/schemas@4.0.1 version dependencies --json
```

## Git tags for each npm package release

Use an annotated Git tag per package and version: `@rbac/core@4.0.1`, `@rbac/adapters@4.0.1`, `@rbac/express@4.0.1`, `@rbac/fastify@4.0.1`, `@rbac/nestjs@4.0.1`, and `@rbac/schemas@4.0.1`. This allows independent package releases in the future. All six packages share the same source commit when released together.

**Only create each tag after that exact version is confirmed published to the public npm registry.** Use the source commit that produced the tested tarballs (verify it before publishing). Run from the repository root in PowerShell:

```powershell
$releaseCommit = git rev-parse HEAD
$names = 'core', 'adapters', 'express', 'fastify', 'nestjs', 'schemas'
foreach ($name in $names) {
    $package = "@rbac/$name"
    $published = npm view "${package}@4.0.1" version
    if ($LASTEXITCODE -ne 0 -or $published.Trim() -ne '4.0.1') {
        throw "$package@4.0.1 is not yet available on npm"
    }

    $manifest = (git show "${releaseCommit}:packages/$name/package.json" | Out-String | ConvertFrom-Json)
    if ($manifest.name -ne $package -or $manifest.version -ne '4.0.1') {
        throw "The chosen release commit does not contain $package@4.0.1"
    }

    $tag = "${package}@4.0.1"
    git show-ref --verify --quiet "refs/tags/$tag"
    if ($LASTEXITCODE -eq 0) { throw "Tag already exists: $tag" }
    git tag -a $tag $releaseCommit -m "Release $tag to npm"
    if ($LASTEXITCODE -ne 0) { throw "Could not create tag: $tag" }
}

git tag --list '@rbac/*@4.0.1'
```

Push the reviewed tags to GitHub only when remote publication is authorized; pushing tags is separate from `npm publish`. Prefer explicit tag refs to `git push --tags`, which may also publish unrelated local tags.

The six historical `@rbac/*@4.0.0` tags were created locally, pointing to migration commit `6781750`; the existing `v3.0.0` tag remains unchanged. Version `4.0.1` must not be tagged until its npm publication succeeds.

## Deprecation of the previous package (manual; not executed)

**Only after** the six v4 packages are available, the migration guide is live, and consumers can install the new package, prepare to mark the old package deprecated without deleting its releases:

```bash
npm deprecate '@rbac/rbac@*' 'This package is superseded by @rbac/core. See https://phellipeandrade.github.io/rbac/docs/migration-3-to-4/ for the migration guide.'
```

Review the scope of this command first: the `@*` range attaches a deprecation notice to **every existing version** of `@rbac/rbac`. It does not remove artifacts or rewrite their contents. Adjust the version range if older versions should remain without a deprecation notice.

After publication, update release notes, GitHub releases, and optional version tags through the normal reviewed Gitflow release process. Existing historical documentation and published npm tarballs remain preserved.
