---
id: intro
title: RBAC 2.x overview
---

# RBAC 2.x

This is the **historical documentation for the 2.x series**, based on its final npm release, **2.2.3**. It covers 2.0.0–2.2.3; some features shown here may not be available in early 2.x minors.

**Deprecated:** 2.x is no longer maintained. Use [3.x (latest)](/rbac/docs/intro/) for new projects and follow the [2.x → 3.x migration guide](/rbac/docs/migration-2-to-3/) for existing integrations.

Compared with 1.x, 2.x is written in TypeScript and ships `.d.ts` declarations. It supports runtime role updates, conditional permissions, database adapters, Express/NestJS/Fastify middleware and tenant-scoped role loading.

```ts
import RBAC from '@rbac/rbac';

const auth = RBAC<{ owner: boolean }>()({
  viewer: { can: ['documents:read'] },
  editor: {
    inherits: ['viewer'],
    can: [{ name: 'documents:edit', when: ({ owner }) => owner }]
  }
});

console.log(await auth.can('editor', 'documents:read')); // true
console.log(await auth.can('editor', 'documents:edit', { owner: true })); // true
```

See [installation](./installation.md), [roles](./roles-permissions.md), [conditions](./conditions.md), [integrations](./integrations.md) and the [2.2.3 API snapshot](./api.md).
