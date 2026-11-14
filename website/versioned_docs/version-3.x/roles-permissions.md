---
id: roles-permissions
title: Roles, permissions and inheritance
---

# Define permission grants

Each role requires a `can` array. Entries are operation strings or `{name, when}` objects. `inherits` is an optional array of parent role names. An empty `can` array is valid.

```ts
import RBAC from '@rbac/rbac';

const rbac = RBAC()({
  guest: { can: ['articles:read'] },
  writer: { inherits: ['guest'], can: ['articles:create', 'articles:edit'] },
  admin: { inherits: ['writer'], can: ['articles:delete'] },
  restricted: { can: [] }
});

console.log(await rbac.can('admin', 'articles:read')); // true
console.log(await rbac.can('writer', 'articles:delete')); // false
console.log(await rbac.can('restricted', 'articles:read')); // false
```

Inheritance is **additive**: a child keeps its own grants and receives the parent grants transitively. An inherited conditional permission retains its condition. There is no explicit deny rule or role membership registry.

## Multiple authorizing rules

Do not assume repeated permissions replace one another. The engine independently evaluates matching conditional grants and succeeds if any condition returns true:

```ts
import RBAC from '@rbac/rbac';

type Context = { owns: boolean; isTeamLead: boolean };
const auth = RBAC<Context>()({
  editor: { can: [
    { name: 'post:update', when: ({ owns }: Context) => owns },
    { name: 'post:update', when: ({ isTeamLead }: Context) => isTeamLead }
  ] }
});

console.log(await auth.can('editor', 'post:update', { owns: false, isTeamLead: true })); // true
```

Use the TypeScript `Roles<P>` and `Role<P>` types when roles come from configuration. For operation matching, see [patterns](./patterns.md).
