---
id: conditions
title: Conditional permissions (2.x)
---

# `when` predicates in 2.2.3

The published TypeScript `When<P>` type accepts booleans, promises, sync or async predicates, and legacy Node-style callbacks.

```ts
import RBAC from '@rbac/rbac';

interface Context { active: boolean; ownerId: number; userId: number }

const auth = RBAC<Context>()({
  editor: {
    can: [{
      name: 'posts:update',
      when: async ({ active, ownerId, userId }) => active && ownerId === userId
    }]
  }
});

console.log(await auth.can('editor', 'posts:update', {
  active: true, ownerId: 12, userId: 12
})); // true
```

Legacy callback syntax (`when: (params, done) => done(null, boolean)`) is also part of the 2.2.3 declared API. The 3.x migration recommends wrapping such callbacks with the explicit `callbackWhen()` helper for predictable behavior.

Do not copy a 3.x helper import into a 2.x project: `@rbac/rbac/helpers` was not declared as a package export in 2.2.3. See [the migration guide](./migration.md).
