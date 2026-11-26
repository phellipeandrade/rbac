# @rbac/core

![RBAC logo](https://raw.githubusercontent.com/phellipeandrade/rbac/master/img/rbac-logo.svg)

Dependency-free hierarchical role-based access control for Node.js and TypeScript.

Requires **Node.js 22.12.0 or later**. Supports CommonJS, ESM, and NodeNext TypeScript consumers.

## Installation

```bash
npm install @rbac/core
```

## Quick start

```ts
import { createRBAC } from '@rbac/core';

const rbac = createRBAC({
  roles: {
    reader: { can: ['articles:read'] },
    editor: { inherits: ['reader'], can: ['articles:edit'] },
  },
  enableLogger: false,
});

console.log(await rbac.can('editor', 'articles:read')); // true, inherited
console.log(await rbac.can('reader', 'articles:edit')); // false
console.log(await rbac.can('unknown', 'articles:read')); // false
```

`createRBAC({ roles, ...options })` returns an engine with `can(role, operation, params?)`, `addRole(name, definition)`, `updateRoles(roles)`, and `replaceRoles(roles)`. Use `updateRoles()` for partial changes and `replaceRoles()` for a complete role set. Import the `RBACOptions` and `RBACEngine` types from the package root. For callback-based conditions, import `callbackWhen` from `@rbac/core/helpers`.

The engine supports inherited roles, exact permissions, globs, regular expressions, asynchronous conditions, and runtime updates. Permission checks **deny by default**, including when a condition throws or rejects. Do not treat client-supplied parameters as trusted authorization evidence.

## Optional integrations

Install only the packages needed by your application:

| Package | Purpose |
| --- | --- |
| `@rbac/adapters` | MongoDB, MySQL, PostgreSQL and multi-tenant roles |
| `@rbac/express` | Express middleware |
| `@rbac/fastify` | Fastify integration |
| `@rbac/nestjs` | NestJS middleware and guard |
| `@rbac/schemas` | Zod validation schemas |

## Documentation and migration

- [Full documentation](https://phellipeandrade.github.io/rbac/docs/intro/)
- [Interactive playground](https://phellipeandrade.github.io/rbac/playground/)
- [v3 → v4 migration guide](https://phellipeandrade.github.io/rbac/docs/migration-3-to-4/)
- [Migration summary](./MIGRATION.md)

Version 4 replaces the former `@rbac/rbac` package and its curried default factory. See the migration guide for changed imports, named exports, and integration packages.
