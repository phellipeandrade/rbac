---
id: runtime
title: Runtime role updates
---

# Change an RBAC instance in memory

`addRole(name, role)` adds or replaces a role. `updateRoles(roles)` merges definitions by name and retains omitted roles. `replaceRoles(roles)` replaces the complete role set in the same instance. All three methods rebuild inherited grants and invalidate permission caches.

```ts
import { createRBAC } from '@rbac/core';

const auth = createRBAC({ roles: { member: { can: ['notes:read'] } } });
console.log(await auth.can('member', 'notes:write')); // false

auth.updateRoles({ member: { can: ['notes:read', 'notes:write'] } });
console.log(await auth.can('member', 'notes:write')); // true

auth.addRole('auditor', { inherits: ['member'], can: ['logs:read'] });
console.log(await auth.can('auditor', 'notes:read')); // true
```

Updates are synchronous. Supply the full `can` array and any `inherits` for each role you change.

## Reload the complete role set

When storage returns the complete role set, pass it to `replaceRoles()`. Roles omitted from that set lose both their direct access and any grants they provided through inheritance. An empty set removes all roles.

```ts
import { createRBAC } from '@rbac/core';

const editor = { inherits: ['admin'], can: ['posts:edit'] };
const auth = createRBAC({ roles: { admin: { can: ['posts:delete'] }, editor } });
console.log(await auth.can('editor', 'posts:delete')); // true

auth.replaceRoles({ editor }); // admin was deleted from storage
console.log(await auth.can('admin', 'posts:delete'));  // false
console.log(await auth.can('editor', 'posts:delete')); // false
console.log(await auth.can('editor', 'posts:edit'));   // true
```

Subsequent calls to `can()` use the new roles. Checks already in progress can finish using the previous roles.

Instances do **not** watch databases or synchronize with each other. See [adapters](./adapters.md) for reloading stored roles. Refresh each process that serves the tenant. User-to-role assignments remain the application's responsibility.
