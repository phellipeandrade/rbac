---
id: api
title: RBAC 1.x API reference
---

# API reference — 1.1.0

This is a **historical API snapshot** based on the published 1.1.0 package and README, not the generated 3.x TypeDoc reference.

| API | Meaning |
| --- | --- |
| `require('@rbac/rbac')` | Load the JavaScript factory. |
| `RBAC(config?)(roles)` | Create an authorization instance. |
| `roles[role].can` | Array of permission strings or conditional `{ name, when }` entries. |
| `roles[role].inherits` | Optional array of roles whose permissions are inherited. |
| `auth.can(role, operation, params?)` | Check authorization asynchronously. |
| `config.enableLogger` | Enable or disable decision logging. |
| `config.logger` | Override the logging function. |

```js
const RBAC = require('@rbac/rbac');
const auth = RBAC({ enableLogger: false })({
  viewer: { can: ['reports:read'] }
});

auth.can('viewer', 'reports:read').then(console.log); // true
```

TypeScript declarations, `addRole`, `updateRoles`, database adapters and framework middlewares are **not part of the published 1.x API**. See [the 1.x to 2.x migration guide](/rbac/docs/migration-1-to-2/) before using them.
