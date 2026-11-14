---
id: migration-3-to-4
title: Migration guide — 3.x to 4.x
---

# Migrate from RBAC 3.x to 4.x

Version 4 reorganizes the npm distribution and replaces the curried default factory with **`createRBAC({ roles, ...options })`**. Authorization remains deny-by-default. This is a breaking major release; change imports and initialization together.

## 1. Install the new packages

Use **Node.js 22.12.0 or later**. Install core first; add only the integrations your application actually uses:

```bash
npm install @rbac/core@^4
npm install @rbac/adapters@^4    # optional: MongoDB, MySQL, PostgreSQL
npm install @rbac/express@^4     # optional: Express middleware
npm install @rbac/fastify@^4     # optional: Fastify preHandler
npm install @rbac/nestjs@^4      # optional: Nest middleware/guard
npm install @rbac/schemas@^4     # optional: Zod role schemas
```

If you use an adapter, also install its matching driver (`mongodb`, `mysql2`, or `pg`). When the migration is complete, remove `@rbac/rbac` from your application. The old package and its published versions are separate npm artifacts; no v4 alias is provided.

| v3 import | v4 import | Main exports |
| --- | --- | --- |
| `@rbac/rbac` | `@rbac/core` | `createRBAC`, `RBACOptions`, `RBACEngine`, role/condition types |
| `@rbac/rbac/helpers` | `@rbac/core/helpers` | `callbackWhen`, utility helpers |
| `@rbac/rbac/adapters` | `@rbac/adapters` | `createTenantRBAC`, adapters, `RoleAdapter` |
| `@rbac/rbac/middlewares` | `@rbac/express`, `@rbac/fastify`, `@rbac/nestjs` | Framework-specific factories |
| `@rbac/rbac/schemas` or `@rbac/rbac/roles.schema` | `@rbac/schemas` | Zod schemas |

Old subpaths such as `@rbac/core/adapters` or `@rbac/core/middlewares` **do not exist**. `@rbac/core/helpers` is the supported core helper subpath.

## 2. Update the factory

**Before (v3):**

```text
import RBAC from '@rbac/rbac';
const auth = RBAC({ enableLogger: false })({
  viewer: { can: ['documents:read'] },
  editor: { inherits: ['viewer'], can: ['documents:edit'] }
});
```

**After (v4):**

```ts
import { createRBAC, type RBACOptions, type RBACEngine } from '@rbac/core';

const options: RBACOptions = {
  enableLogger: false,
  roles: {
    viewer: { can: ['documents:read'] },
    editor: { inherits: ['viewer'], can: ['documents:edit'] }
  }
};

const auth: RBACEngine = createRBAC(options);
console.log(await auth.can('editor', 'documents:read')); // true
console.log(await auth.can('viewer', 'documents:edit')); // false
```

The default `RBAC` factory is removed in v4; the function is a **named** export. `RBACConfig` still describes optional logging settings, while **`RBACOptions<P>`** combines the required `roles` map with those settings. `RBACEngine<P>` describes the returned instance. Pass the context type parameter when your `when` conditions use typed request data:

```ts
import { createRBAC } from '@rbac/core';
import { callbackWhen } from '@rbac/core/helpers';

type Context = { ownerId: string; userId: string };
const auth = createRBAC<Context>({
  roles: { author: { can: [
    { name: 'documents:edit', when: (params: Context) => params.ownerId === params.userId },
    { name: 'documents:review', when: callbackWhen<Context>((params, done) => done(null, params.userId === params.ownerId)) }
  ] } }
});
console.log(await auth.can('author', 'documents:edit', { ownerId: '1', userId: '1' }));
```

The `can(role, operation, params?)` method still returns `Promise<boolean>`. `addRole()` and `updateRoles()` still rebuild the permission hierarchy. Unknown roles, rejected conditions, and unmatched operations remain denied.

## 3. Migrate integrations and module formats

Import each integration from its dedicated package:

```ts
import { createRBAC } from '@rbac/core';
import { createExpressMiddleware } from '@rbac/express';
import { createFastifyMiddleware } from '@rbac/fastify';
import { createNestMiddleware, createNestGuard } from '@rbac/nestjs';
import { createTenantRBAC, MongoRoleAdapter } from '@rbac/adapters';
import { rolesSchema } from '@rbac/schemas';

const auth = createRBAC({ roles: { viewer: { can: ['documents:read'] } } });
const expressPermission = createExpressMiddleware(auth);
const fastifyPermission = createFastifyMiddleware(auth);
const nestPermission = createNestMiddleware(auth);
const nestGuard = createNestGuard(auth);
const parsedRoles = rolesSchema.parse({ viewer: { can: ['documents:read'] } });
void [expressPermission, fastifyPermission, nestPermission, nestGuard, parsedRoles];
// createTenantRBAC(adapter, tenantId, options?) loads stored roles for one tenant.
void [createTenantRBAC, MongoRoleAdapter];
```

For CommonJS, destructure the named export: `const { createRBAC } = require('@rbac/core')`. ESM uses `import { createRBAC } from '@rbac/core'`. v4 provides type declarations for NodeNext ESM and CommonJS consumers and keeps its CommonJS and ESM core entry points backed by a shared implementation.

Frameworks still need trusted, server-verified role extraction. Adapter connections and tenant IDs remain explicit; changing package paths must not change your tenant boundaries. Database role definitions cannot serialize arbitrary executable closures.

## 4. Validate before deploying

1. Run TypeScript compilation and tests against the real v4 package exports, including CommonJS and ESM consumers.
2. Test **allowed and denied** direct grants, inherited grants, glob/regex grants, unknown roles, and multiple conditional grants with distinct parameters.
3. Confirm failed/rejected predicates deny access, and runtime updates immediately invalidate permission matching caches.
4. Test each tenant separately and verify adapter SQL identifiers, custom column mapping, and parameter binding.
5. Verify all Express, Fastify, and Nest routes use an authenticated role source, handle denials, and propagate unexpected errors correctly.

See the [current API reference](./api/index.md), [adapter guide](./adapters.md), and [middleware guide](./middlewares.md). The deprecated `@rbac/rbac` package should point to this guide **after** v4 is published; no npm release or deprecation occurs as part of this documentation change.
