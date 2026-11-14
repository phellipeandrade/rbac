# Migrating NestJS integration to v4

Replace `@rbac/rbac/middlewares` with `@rbac/nestjs`; install `npm install @rbac/core @rbac/nestjs`.

```ts
import {createRBAC} from '@rbac/core';
import {createNestGuard} from '@rbac/nestjs';
const auth = createRBAC({roles: {viewer: {can: ['posts:read']}}});
const guard = createNestGuard(auth)('posts:read');
```

`createNestMiddleware` is also exported for middleware-based integration. See the [full v3 → v4 guide](https://phellipeandrade.github.io/rbac/docs/migration-3-to-4/).
