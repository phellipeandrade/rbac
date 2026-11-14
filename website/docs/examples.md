---
id: examples
title: Practical examples
---

# Start with small rules

These examples execute against the actual public API and can be adapted to your application. Install `@rbac/core` first.

## A role hierarchy

```ts
import { createRBAC } from '@rbac/core';

const auth = createRBAC({ roles: {
  guest: { can: ['catalog:view'] },
  seller: { inherits: ['guest'], can: ['catalog:create'] },
  manager: { inherits: ['seller'], can: ['catalog:remove'] }
} });

console.log(await auth.can('manager', 'catalog:view')); // true
console.log(await auth.can('seller', 'catalog:remove')); // false
```

## Restrict ownership with async logic

```ts
import { createRBAC } from '@rbac/core';

type Context = { actorId: string; documentId: string };
async function belongsTo(actorId: string, documentId: string): Promise<boolean> {
  // Replace with a trusted lookup in your database.
  return actorId === 'user-1' && documentId === 'doc-1';
}

const auth = createRBAC<Context>({ roles: {
  writer: { can: [{
    name: 'document:edit',
    when: ({ actorId, documentId }: Context) => belongsTo(actorId, documentId)
  }] }
} });

console.log(await auth.can('writer', 'document:edit', {
  actorId: 'user-1', documentId: 'doc-1'
})); // true
```

## Validate role configuration

```ts
import { rolesSchema } from '@rbac/schemas';

const validated = rolesSchema.parse({
  guest: { can: ['catalog:view'] }
});
console.log(validated.guest.can); // ['catalog:view']
```

Schemas are an opt-in Zod subpath; this does not imply that arbitrary serialized functions are executable permissions. See [conditions](./conditions.md), [adapters](./adapters.md), and the [playground](/playground).
