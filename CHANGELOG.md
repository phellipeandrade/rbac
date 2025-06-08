# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.2.0] - 2025-06-08
### Added
- Benchmark suite with `npm run bench` to measure permission checks

### Changed
- Simplified helper utilities using TypeScript features

### Benchmark
- direct permission: ~74k ops/s
- inherited permission: ~37k ops/s
- glob permission: ~72k ops/s

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
