---
id: intro
title: RBAC 1.x overview
---

# RBAC 1.x

This is the **historical documentation for the 1.x major series**, based on its final npm release, **1.1.0**. It covers published releases 1.0.0–1.1.0; capabilities introduced in 1.1.0, such as glob matching, may not exist in earlier 1.0.x releases.

**Deprecated:** 1.x is no longer maintained. New applications should use [3.x (latest)](/rbac/docs/intro/). Existing applications should follow the [1.x → 2.x migration guide](/rbac/docs/migration-1-to-2/) and then the [2.x → 3.x migration guide](/rbac/docs/migration-2-to-3/).

The 1.x release provides a small JavaScript role-based authorization engine with inherited permissions, wildcard patterns and conditions. It exposes a curried factory: `RBAC(config)(roles)`.

```js
const RBAC = require('@rbac/rbac');

const auth = RBAC({ enableLogger: false })({
  reader: { can: ['articles:read'] },
  editor: { inherits: ['reader'], can: ['articles:write'] }
});

auth.can('editor', 'articles:read').then(console.log); // true
auth.can('reader', 'articles:write').then(console.log); // false
```

The historical distribution is a bundled JavaScript package. **It does not ship TypeScript declaration files** and does not expose the runtime role update or tenant adapter APIs introduced in 2.x.

Start with [installation](./installation.md), then review [permissions](./roles-permissions.md) and [conditions](./conditions.md). The [historical API reference](./api.md) describes 1.1.0.
