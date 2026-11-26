---
id: runtime
title: Runtime role updates
---

# Change an RBAC instance in memory

`addRole(name, role)` adds or replaces a role. `updateRoles(roles)` merges named definitions into the instance, replacing each matching role's complete definition, rebuilding inherited grants, and invalidating permission caches.

```ts
import { createRBAC } from '@rbac/core';

const auth = createRBAC({ roles: { member: { can: ['notes:read'] } } });
console.log(await auth.can('member', 'notes:write')); // false

auth.updateRoles({ member: { can: ['notes:read', 'notes:write'] } });
console.log(await auth.can('member', 'notes:write')); // true

auth.addRole('auditor', { inherits: ['member'], can: ['logs:read'] });
console.log(await auth.can('auditor', 'notes:read')); // true
```

Updates are synchronous. Define the full `can` array (and any `inherits`) when replacing a role; unspecified fields are not preserved for that role. Existing roles omitted from `updateRoles()` remain available.

Instances do **not** watch databases or synchronize with each other.

## Reload the complete role set

After a role definition is deleted from storage, create a new instance from the complete set of remaining roles. Calling `updateRoles()` with that set leaves the deleted role in the existing instance, where it can still grant permissions directly and through inheritance.

```ts
import { createRBAC } from '@rbac/core';

const editor = { inherits: ['admin'], can: ['posts:edit'] };
let auth = createRBAC({ roles: { admin: { can: ['posts:delete'] }, editor } });
console.log(await auth.can('editor', 'posts:delete')); // true

// Complete role set returned by storage after admin is deleted.
auth = createRBAC({ roles: { editor } });
console.log(await auth.can('admin', 'posts:delete')); // false
console.log(await auth.can('editor', 'posts:delete')); // false
console.log(await auth.can('editor', 'posts:edit'));   // true
```

Keep the same engine options when replacing the instance. If you load roles with an [adapter](./adapters.md), call `createTenantRBAC()` again for the same tenant and use the returned instance for subsequent checks. Each process serving that tenant needs to refresh its own instance. Revoking a user's assignment to a role is separate and takes effect when the application uses the updated assignment for authorization.
