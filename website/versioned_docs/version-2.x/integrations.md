---
id: integrations
title: Integrations (2.x)
---

# Middleware and persistence in 2.2.3

The 2.2.3 source and declarations include middleware factories for Express, NestJS and Fastify, a `RoleAdapter` interface, and MongoDB, MySQL, and PostgreSQL adapter implementations.

The **package root** explicitly re-exports these middleware factories:

```ts
import {
  createExpressMiddleware,
  createNestMiddleware,
  createFastifyMiddleware
} from '@rbac/rbac';
```

It also exports the `createTenantRBAC` factory, which loads roles from an adapter for a specified tenant:

```ts
import { createTenantRBAC } from '@rbac/rbac';

// adapter must implement getRoles, addRole and updateRoles.
// const auth = await createTenantRBAC(adapter, 'tenant-a');
```

**Important packaging limitation:** The published 2.2.3 `package.json` export map contains only `"."`, while adapter implementation files live under `lib/adapters`. Consequently, adapter deep imports are not guaranteed to resolve in environments that enforce package exports. The 2.x root declarations also do not re-export adapter classes. Inspect your actual integration before relying on any historical deep import; 3.x provides [supported adapter subpaths](/rbac/docs/adapters/).

Use [the migration guide](./migration.md) for updated package exports, driver installation, SQL identifier validation and current middleware contracts.
