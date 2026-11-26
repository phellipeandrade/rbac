---
id: intro
title: Introduction
sidebar_position: 1
---

![RBAC shield and padlock](/img/rbac-icon.svg)

# Authorization without surprises

`@rbac/core` is a TypeScript library for **role-based access control** in Node.js. Give roles permission to perform operations, optionally inherit permissions from other roles, then ask the library whether an operation is allowed.

It handles **authorization**, not authentication: your application identifies the user, determines the user's trusted role, and supplies any required context. RBAC returns a decision; your application enforces it.

## A complete decision

```ts showLineNumbers highlight={8-10}
import { createRBAC } from '@rbac/core';

const rbac = createRBAC({ roles: {
  viewer: { can: ['documents:read'] },
  editor: { inherits: ['viewer'], can: ['documents:edit'] }
} });

console.log(await rbac.can('editor', 'documents:read')); // true
console.log(await rbac.can('viewer', 'documents:edit')); // false
console.log(await rbac.can('unknown', 'documents:read')); // false
```

`createRBAC({ roles, ...options })` returns an instance with `can()`, `addRole()`, `updateRoles()`, and `replaceRoles()`. Permission checks always return a promise, even for unconditional grants. Undefined roles and missing grants are denied by default.

## What the library provides

| Capability | Relevant guide |
| --- | --- |
| Exact permissions, inheritance, repeated conditional grants | [Roles and permissions](./roles-permissions.md) |
| Wildcards and regular expressions | [Patterns](./patterns.md) |
| Request-aware rules and asynchronous predicates | [Conditions](./conditions.md) |
| Runtime role management | [Runtime changes](./runtime.md) |
| Tenant-based persistence | [Database adapters](./adapters.md) |
| Express, NestJS, Fastify | [Middleware](./middlewares.md) |

Continue with [installation](./installation.md), or try the [interactive playground](/playground).

## Brand assets

The [full RBAC logo](/img/rbac-logo.svg) and [shield-and-padlock icon](/img/rbac-icon.svg) are transparent, fully vector SVGs with no external font dependencies. The visual identity uses **blue `#2563EB`** and **navy `#0F172A`**; the website also includes a light-wordmark variant for dark navigation backgrounds.
