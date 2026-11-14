---
id: concepts
title: Core concepts
---

# How authorization works

**User**: identified by your application. RBAC does not maintain user accounts or memberships. **Role**: a named definition, such as `editor`. **Operation**: an application-defined string like `invoices:approve`. **Grant**: an entry in a role's `can` array. **Condition**: optional `when` rule, evaluated with the current request's parameters. **Inheritance**: additive permissions obtained from another role.

```ts
import { createRBAC } from '@rbac/core';

type RequestContext = { ownerId: string; userId: string };

const auth = createRBAC<RequestContext>({ roles: {
  reader: { can: ['items:read'] },
  author: {
    inherits: ['reader'],
    can: [{ name: 'items:edit', when: ({ ownerId, userId }: RequestContext) => ownerId === userId }]
  }
} });

console.log(await auth.can('author', 'items:read')); // true
console.log(await auth.can('author', 'items:edit', { ownerId: 'a', userId: 'b' })); // false
```

The engine evaluates exact grants and matching patterns, includes inherited grants, and checks any conditions that can authorize the requested operation. Matching grants combine with **OR semantics**. No matching successful grant means `false`. A thrown exception or rejected condition is treated as a denied grant.

## API shape

| Member | Purpose |
| --- | --- |
| `createRBAC<P>({ roles, ...options })` | Create an in-memory authorization instance typed by context `P`. |
| `can(role, operation, params?)` | Resolve permission asynchronously as `Promise<boolean>`. |
| `addRole(name, definition)` | Add or replace a named role immediately. |
| `updateRoles(definitions)` | Merge new role definitions by name and invalidate permission caches. |

The generic `P` describes authorization context, not a user object stored by RBAC. See [security guidance](./security-performance.md) for deriving trusted roles.
