---
id: runtime
title: Runtime role updates
---

# Change an RBAC instance in memory

`addRole(name, role)` adds or replaces a role. `updateRoles(roles)` merges named definitions into the instance, replacing each matching role's complete definition, rebuilding inherited grants, and invalidating permission caches.

```ts
import RBAC from '@rbac/rbac';

const auth = RBAC()({ member: { can: ['notes:read'] } });
console.log(await auth.can('member', 'notes:write')); // false

auth.updateRoles({ member: { can: ['notes:read', 'notes:write'] } });
console.log(await auth.can('member', 'notes:write')); // true

auth.addRole('auditor', { inherits: ['member'], can: ['logs:read'] });
console.log(await auth.can('auditor', 'notes:read')); // true
```

Updates are synchronous. Define the full `can` array (and any `inherits`) when replacing a role; unspecified fields are not preserved for that role. Existing roles omitted from `updateRoles()` remain available.

Instances do **not** watch databases or synchronize with each other. Adapter writes are explicit; see [adapters](./adapters.md). In a multi-process deployment, distribute role changes and refresh each process as appropriate.
