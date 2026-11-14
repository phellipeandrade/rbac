---
id: roles-permissions
title: Roles and permissions (2.x)
---

# Roles and runtime updates

Role definitions contain permission strings or conditional `{ name, when }` grants. A role can inherit another role's permissions.

```ts
import RBAC from '@rbac/rbac';

const auth = RBAC()({
  viewer: { can: ['files:read'] },
  editor: { inherits: ['viewer'], can: ['files:write'] }
});

console.log(await auth.can('editor', 'files:read')); // true

auth.addRole('admin', { inherits: ['editor'], can: ['files:delete'] });
console.log(await auth.can('admin', 'files:delete')); // true

auth.updateRoles({ viewer: { can: ['files:read', 'files:list'] } });
console.log(await auth.can('editor', 'files:list')); // true
```

In 2.2.3, `updateRoles` merges supplied definitions and `addRole` adds or replaces one role. `can(role, operation, params?)` returns `Promise<boolean>`. Glob and regular-expression operation matching are supported; test the exact pattern semantics of your deployed minor when upgrading.

For request-dependent grants, see [conditions](./conditions.md). For behavioral and security fixes in the latest line, see the [migration guide](./migration.md).
