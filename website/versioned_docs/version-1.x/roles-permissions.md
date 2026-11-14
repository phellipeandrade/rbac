---
id: roles-permissions
title: Roles and permissions (1.x)
---

# Roles, permissions, and inheritance

Pass a map of role names to the second factory call. Each role has a `can` array and can optionally inherit other roles through `inherits`.

```js
const RBAC = require('@rbac/rbac');

const auth = RBAC()({
  guest: { can: ['posts:view'] },
  member: { inherits: ['guest'], can: ['posts:comment'] },
  moderator: { inherits: ['member'], can: ['posts:*'] }
});

auth.can('member', 'posts:view').then(console.log); // true
auth.can('guest', 'posts:comment').then(console.log); // false
```

The `*` wildcard is documented for **1.1.0**. Earlier 1.0.x releases may behave differently; verify patterns if running one of those versions. The historical README also documents regular-expression operations. A permission may be a string or an object with `name` and `when`.

Authorization decisions should be awaited. A role name is supplied by your application after authentication; do not trust an unverified client-provided role. Continue with [conditions](./conditions.md).
