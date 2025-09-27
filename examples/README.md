# RBAC Examples

This directory contains self-contained TypeScript snippets that showcase how to use the library in different scenarios. Each file can be executed with `ts-node` (or transpiled to JavaScript) and is fully documented in English.

## Core building blocks

- [`configuredRBAC.ts`](./configuredRBAC.ts) creates a reusable RBAC factory configured with logging disabled.
- [`roles.ts`](./roles.ts) defines a role hierarchy with conditional permissions using the `when` callback for additional context checks.
- [`index.ts`](./index.ts) demonstrates how to instantiate RBAC with the predefined roles and perform permission checks for multiple roles.
- [`basicUsage.ts`](./basicUsage.ts) shows a real-world check where user data is passed as context to evaluate permissions.

## Updating roles at runtime

- [`updateRoles.ts`](./updateRoles.ts) illustrates how to add new roles and merge updates without restarting your application.

## Database adapters

- [`mongodbAdapter.ts`](./mongodbAdapter.ts) loads role definitions from MongoDB and performs checks against the retrieved data.
- [`mysqlAdapter.ts`](./mysqlAdapter.ts) does the same using a MySQL database.
- [`postgresAdapter.ts`](./postgresAdapter.ts) demonstrates the PostgreSQL adapter with custom column mappings.

## Multi-tenant environments

- [`multiTenant.ts`](./multiTenant.ts) stores and retrieves tenant-scoped roles using the MongoDB adapter and `createTenantRBAC` helper.

## Framework middlewares

- [`expressMiddleware.ts`](./expressMiddleware.ts) integrates RBAC checks into Express routes.
- [`fastifyMiddleware.ts`](./fastifyMiddleware.ts) adds RBAC validation to Fastify handlers.
- [`nestMiddleware.ts`](./nestMiddleware.ts) shows how to plug RBAC into a NestJS module using middleware.

Each example is intentionally concise and focuses on a single scenario so you can copy the file that best matches your use case and adapt it to your project.
