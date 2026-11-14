# Migrating from RBAC 3.x to 4.0

The v3 package `@rbac/rbac` is replaced by `@rbac/core` in v4. Install with `npm install @rbac/core`.

```ts
// v3
import RBAC from '@rbac/rbac';
const auth = RBAC({enableLogger: false})({viewer: {can: ['files:read']}});
```

```ts
// v4
import {createRBAC} from '@rbac/core';
const auth = createRBAC({roles: {viewer: {can: ['files:read']}}, enableLogger: false});
```

The curried factory and default export have been removed. Use the named `createRBAC`, `RBACOptions`, and `RBACEngine` exports. Helper functions now live in `@rbac/core/helpers`. Install separate `@rbac/adapters`, `@rbac/express`, `@rbac/fastify`, `@rbac/nestjs`, and `@rbac/schemas` packages as needed.

See the [complete v3 → v4 migration guide](https://phellipeandrade.github.io/rbac/docs/migration-3-to-4/) for imports, dependencies, integrations, types, and release transition.
