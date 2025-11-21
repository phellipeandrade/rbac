# RBAC

Hierarchical Role-Based Access Control (RBAC) for Node.js and TypeScript. The library is curried for flexible setup, keeps dependencies to a minimum, and ships with first-class TypeScript types.

## Highlights

- **Operation-first design:** Define operations as strings, globs, or regular expressions, and check them with a simple `can` helper.
- **Hierarchical roles:** Reuse permissions with inheritance and update definitions at runtime without rebuilding your app.
- **Runtime conditions:** Attach synchronous, async, promise-based, or callback-based guards to any permission.
- **Adapters and middleware:** Load or persist role definitions through MongoDB, MySQL, or PostgreSQL adapters and guard routes with Express, NestJS, or Fastify helpers.
- **Multi-tenant ready:** Scope role definitions to tenants using the optional adapter utilities.

## Quick tour

```ts
import RBAC from '@rbac/rbac';

const rbac = RBAC({ enableLogger: false })({
  user: { can: ['products:find'] },
  admin: { can: ['products:*'], inherits: ['user'] }
});

await rbac.can('user', 'products:find'); // true
await rbac.can('admin', 'products:delete'); // true via inheritance and wildcard
```

Use the navigation to explore setup instructions, conceptual guides, feature comparisons, and practical usage recipes.
