---
id: api
title: RBAC 2.x API reference
---

# API reference — 2.2.3

This historical snapshot is based on the **published 2.2.3 TypeScript declarations**. It is independent of the generated 3.x API reference.

| API | 2.2.3 contract |
| --- | --- |
| `RBAC<P>(config?)(roles)` | Create an authorization instance. |
| `auth.can(role, operation, params?)` | Return `Promise<boolean>`. Operation accepts `string \| RegExp`. |
| `auth.updateRoles(roles)` | Update the in-memory role map. |
| `auth.addRole(name, role)` | Add or replace an in-memory role. |
| `Role<P>` | `{ can: Array<string \| { name, when }>, inherits?: string[] }`. |
| `When<P>` | Boolean, promise, predicate or Node-style callback. |
| `RBACConfig` | `logger?`, `enableLogger?`, `colors?`. |
| `createTenantRBAC(adapter, tenantId, config?)` | Build an RBAC instance from adapter-backed roles. |
| `createExpressMiddleware`, `createNestMiddleware`, `createFastifyMiddleware` | Framework integration factories exported from the package root. |

```ts
import RBAC from '@rbac/rbac';

const auth = RBAC<{ approved: boolean }>()({
  reviewer: { can: [{ name: 'reviews:accept', when: ({ approved }) => approved }] }
});

console.log(await auth.can('reviewer', 'reviews:accept', { approved: true })); // true
```

2.2.3 publishes a root-only exports map. Later features such as the `@rbac/rbac/helpers` and `/schemas` subpaths and the Nest guard belong to [3.x](/rbac/docs/api/), not this historical snapshot.
