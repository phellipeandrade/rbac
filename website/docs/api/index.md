---
id: api
title: API reference
slug: /api
---

# Public API reference

The reference below is **generated from the TypeScript source with TypeDoc** on every documentation build. Use it for complete signatures, types, and adapter options. The guides provide implementation context and executable examples.

| Import path | Exports |
| --- | --- |
| `@rbac/rbac` | `RBAC` default factory, `createTenantRBAC`, adapter and middleware exports, public types |
| `@rbac/rbac/adapters` | `RoleAdapter`, `MongoRoleAdapter`, `MySQLRoleAdapter`, `PostgresRoleAdapter` |
| `@rbac/rbac/middlewares` | `createExpressMiddleware`, `createNestMiddleware`, `createNestGuard`, `createFastifyMiddleware` |
| `@rbac/rbac/helpers` | `callbackWhen`, pattern utilities, logging and normalization helpers |
| `@rbac/rbac/schemas` or `/roles.schema` | `whenSchema`, `roleOperationSchema`, `roleSchema`, `rolesSchema` |

Browse the **generated entries** under this API sidebar or start at the [TypeDoc reference](./reference/README.md).
