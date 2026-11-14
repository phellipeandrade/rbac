# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.0.0] - 2026-11-14

### Breaking Changes

- Require Node.js `>=22.12.0` (previous versions of Node.js are no longer supported).
- Import Zod validation schemas from `@rbac/rbac/schemas` or `@rbac/rbac/roles.schema` instead of the package root.
- SQL adapter table and column names must use valid identifiers; invalid names now throw during adapter construction.

### Added

- Explicit `callbackWhen()` helper to adapt Node.js callback-based permission conditions.
- `createNestGuard()` for native NestJS HTTP authorization through the `CanActivate` contract.
- Dedicated package exports for adapters, middlewares, helpers and validation schemas.
- Package compatibility tests covering CommonJS, ES Modules, TypeScript declarations and shared module identity.
- Regression tests for conditional authorization, SQL injection, bounded caches, adapter connections and package exports.
- Benchmark suite with `npm run bench` to measure permission checks.

### Changed

- Replace the Vite/Babel build pipeline with a TypeScript-based build generating dedicated CommonJS and ESM entrypoints.
- Generate format-specific TypeScript declarations for CommonJS and ES Modules.
- Refactor permission evaluation and helper utilities into smaller, focused modules.
- Simplify adapter implementations by centralizing column mapping, tenant resolution and role deserialization.
- Improve database connection management by reusing connection initialization across concurrent requests and retrying failed connection attempts.
- Introduce bounded LRU caches for regex, glob, operation, role and permission lookups.
- Rebuild role hierarchy when roles change at runtime to improve permission checks.
- Flatten inherited permissions for faster lookups.
- Optimize permission matching using `Map`, cached regex/glob conversions and direct permission fast paths.
- Unify asynchronous handling for synchronous, callback-based, Promise and async permission conditions.
- Modernize CircleCI using Node.js 22.14 and `npm ci`.
- Add automated linting, type checking, package build, regression tests and npm package validation to CI.
- Update documentation, import examples, middleware integration guides and development workflow.

### Fixed

- Preserve multiple conditional permissions targeting the same operation instead of overwriting previous conditions.
- Preserve conditional permissions across inherited roles and identical glob/regex patterns.
- Correctly evaluate independent permission conditions using OR semantics.
- Support role names matching properties inherited from `Object.prototype`, including `constructor` and `__proto__`.
- Prevent unknown prototype properties from being interpreted as valid roles.
- Correctly parse Buffer-backed JSON role definitions returned by database drivers.
- Improve regex detection so regular operation names remain literals and slash-delimited expressions are handled correctly.
- Align Express, NestJS and Fastify middleware typings with their respective framework contracts.
- Improve type safety by removing unsafe `any` usage from adapter and middleware implementations.

### Security

- Validate SQL table and column identifiers in MySQL and PostgreSQL adapters.
- Quote validated SQL identifiers according to the respective database dialect.
- Reject malformed or potentially injected identifiers before executing SQL queries.
- Support schema-qualified SQL table names while maintaining identifier validation.

### Benchmark

Updated benchmark measurements for `@rbac/rbac` (operations per second):

| Scenario      | Direct  | Inherited | Glob    | Callback | Async   | Promise |
| ------------- | ------- | --------- | ------- | -------- | ------- | ------- |
| Baseline      | 705,928 | 686,871   | 421,587 | —        | —       | —       |
| Large dataset | 395,934 | 579,837   | 533,091 | 84,314   | 411,722 | 292,185 |

Results are environment-dependent. See `benchmarks/results/` for detailed JSON, CSV and HTML reports.

## [2.1.0] - 2025-06-08

### Added

- Multi-tenant support via `createTenantRBAC`.
- Option to configure table and column names for database adapters.

### Changed

- Improved CircleCI configuration.

## [2.0.0] - 2025-06-08

### Added

- Completely rewritten in TypeScript.
- Ability to update roles at runtime (`updateRoles`).
- Adapters for MongoDB, MySQL and PostgreSQL.
- Official middlewares for Express, NestJS and Fastify.

[Unreleased]: https://github.com/phellipeandrade/rbac/compare/v3.0.0...HEAD
[3.0.0]: https://github.com/phellipeandrade/rbac/releases/tag/v3.0.0
