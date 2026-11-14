# Migrating Fastify integration to v4

Replace `@rbac/rbac/middlewares` with `@rbac/fastify`; install `npm install @rbac/core @rbac/fastify`.

```ts
import {createRBAC} from '@rbac/core';
import {createFastifyMiddleware} from '@rbac/fastify';
const auth = createRBAC({roles: {viewer: {can: ['posts:read']}}});
const requirePermission = createFastifyMiddleware(auth);
fastify.get('/posts', {preHandler: requirePermission('posts:read')}, handler);
```

See the [full v3 → v4 guide](https://phellipeandrade.github.io/rbac/docs/migration-3-to-4/) for details.
