# Migrating the Express middleware to v4

Replace `@rbac/rbac/middlewares` with `@rbac/express` for the Express integration; install `npm install @rbac/core @rbac/express`.

```ts
import {createRBAC} from '@rbac/core';
import {createExpressMiddleware} from '@rbac/express';
const auth = createRBAC({roles: {viewer: {can: ['posts:read']}}});
const requirePermission = createExpressMiddleware(auth);
app.get('/posts', requirePermission('posts:read'), handler);
```

See the [full v3 → v4 guide](https://phellipeandrade.github.io/rbac/docs/migration-3-to-4/) for setup and types.
