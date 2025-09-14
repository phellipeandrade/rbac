# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.2.0] - 2025-01-27
### Added
- Complete plugin system with hooks and community plugin support
- Built-in plugins: Cache, Audit, Notification, Validation, and Middleware
- Comprehensive plugin documentation and examples
- Community plugin template and development guidelines

### Changed
- Complete internationalization: All code, comments, and documentation translated to English
- Enhanced TypeScript support with improved type definitions
- Improved plugin management and error handling
- Updated README with comprehensive plugin system documentation

### Fixed
- All TypeScript compilation errors resolved
- Improved type safety across the entire codebase
- Better error handling in plugin system

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
