# RBAC

**Hierarchical role-based access control for Node.js and TypeScript.**

[![npm version](https://img.shields.io/npm/v/@rbac/core.svg)](https://www.npmjs.com/package/@rbac/core)
[![CI](https://github.com/phellipeandrade/rbac/actions/workflows/ci.yml/badge.svg)](https://github.com/phellipeandrade/rbac/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@rbac/core.svg)](LICENSE)

RBAC makes authorization decisions from roles, permission names, inheritance, and optional conditions. Define policies in code or load role definitions through a database adapter, then check operations with an asynchronous, **deny-by-default** API.

- **Hierarchical roles:** inherited grants are additive, including conditional grants.
- **Precise matching:** exact operations, globs (`*` and `**`), and regular expressions.
- **Conditional access:** synchronous/async predicates, promises, and explicit callback adapters.
- **Runtime updates:** add or merge roles without recreating the authorization instance.
- **Optional integrations:** MongoDB, MySQL, PostgreSQL, Express, NestJS, and Fastify.
- **Package interoperability:** CommonJS and ESM entry points with TypeScript declarations; matching caches are bounded.

**Requirements:** Node.js **22.12.0+**. The current major version is **4.x**; review the [migration guide](https://phellipeandrade.github.io/rbac/docs/migration/) when upgrading.

## Documentation

**[Full documentation](https://phellipeandrade.github.io/rbac/docs/intro/)** · **[Interactive playground](https://phellipeandrade.github.io/rbac/playground/)** · **[Generated API reference](https://phellipeandrade.github.io/rbac/docs/api/)** · **[Português (Brasil)](https://phellipeandrade.github.io/rbac/pt-BR/docs/intro/)**

The documentation includes complete guides to roles and inheritance, conditions, patterns, runtime updates, database adapters, framework integrations, security, examples, and migration. API reference pages are generated from the public TypeScript entry points.

See the runnable examples in [`examples/`](examples/) and version history in [`CHANGELOG.md`](CHANGELOG.md).

## Install

```bash
npm install @rbac/core
```

## Quick start

```ts
import { createRBAC } from '@rbac/core';

const auth = createRBAC({ roles: {
  viewer: { can: ['posts:read'] },
  editor: { inherits: ['viewer'], can: ['posts:create', 'posts:update'] },
  admin: { inherits: ['editor'], can: ['posts:delete'] }
}, enableLogger: false });

async function main() {
  console.log(await auth.can('editor', 'posts:read'));   // true: inherited
  console.log(await auth.can('viewer', 'posts:delete')); // false
  console.log(await auth.can('unknown', 'posts:read'));  // false
}

void main();
```

`createRBAC({ roles, ...options })` returns an instance with three methods:

| Method | Description |
| --- | --- |
| `can(role, operation, params?)` | Resolves to `Promise<boolean>`; unmatched operations and unknown roles are denied. |
| `addRole(name, definition)` | Adds or replaces one role, immediately rebuilding the permission hierarchy. |
| `updateRoles(roles)` | Merges definitions into existing roles and invalidates matching caches. |

The `can` parameter `operation` accepts a string or `RegExp`. Roles require a `can` array of operation strings or `{name, when}` grants; `inherits` is an optional array of role names.

### Conditions and asynchronous authorization

```ts
import { createRBAC } from '@rbac/core';

type Context = { userId: string; ownerId: string };

const auth = createRBAC<Context>({ roles: {
  author: {
    can: [{
      name: 'article:edit',
      when: async ({ userId, ownerId }: Context) => userId === ownerId
    }]
  }
} });

console.log(await auth.can('author', 'article:edit', {
  userId: '42',
  ownerId: '42'
})); // true
```

Conditions may return a boolean or a promise. For existing Node-style callback predicates, use `callbackWhen()` from `@rbac/core/helpers`. Authorization errors and rejected conditions fail closed. **Validate ownership and role information on the server:** values supplied by a client are not trustworthy evidence.

Multiple conditional grants for an operation use OR semantics; each condition stays independently evaluable. Conditional results are evaluated for each call, including after role updates.

### Patterns

```ts
import { createRBAC } from '@rbac/core';

const auth = createRBAC({ roles: {
  operator: { can: ['orders:*', 'files/**', '/^reports:(read|export)$/'] }
} });

console.log(await auth.can('operator', 'orders:approve')); // true
console.log(await auth.can('operator', 'reports:read'));  // true
console.log(await auth.can('operator', 'users:delete'));  // false
```

Use exact permissions for sensitive operations. [Pattern matching guide](https://phellipeandrade.github.io/rbac/docs/patterns/).

### Update roles at runtime

```ts
import { createRBAC } from '@rbac/core';

const auth = createRBAC({ roles: { viewer: { can: ['tickets:read'] } } });
auth.addRole('support', { can: ['tickets:read'] });
auth.updateRoles({ support: { can: ['tickets:read', 'tickets:reply'] } });
console.log(await auth.can('support', 'tickets:reply')); // true
```

Updates merge role **definitions**, replacing the definition of any role name supplied.

## Database adapters and multi-tenancy

Use `@rbac/adapters` for `MongoRoleAdapter`, `MySQLRoleAdapter`, or `PostgresRoleAdapter`. Install only the database driver your application needs (`mongodb`, `mysql2`, or `pg`). Adapters implement `getRoles`, `addRole`, and `updateRoles`, with optional tenant IDs.

```ts
import { createTenantRBAC } from '@rbac/adapters';
import { MongoRoleAdapter } from '@rbac/adapters';

const adapter = new MongoRoleAdapter({
  uri: 'mongodb://localhost:27017',
  dbName: 'app',
  collection: 'rbac_roles'
});

const tenantAuth = await createTenantRBAC(adapter, 'tenant-a');
console.log(await tenantAuth.can('reader', 'documents:read'));
```

This example assumes a running MongoDB instance and existing tenant role records. `createTenantRBAC` loads the roles **once**; reload or update the instance when persistent policies change. See the [adapter guide](https://phellipeandrade.github.io/rbac/docs/adapters/) for schema requirements, custom columns, and tenant isolation.

## Frameworks, schemas, and configuration

Express, NestJS, and Fastify integrations are available through separate `@rbac/express`, `@rbac/nestjs`, and `@rbac/fastify` packages. Authenticate users before extracting their roles. See [middleware integration examples](https://phellipeandrade.github.io/rbac/docs/middlewares/).

Validation schemas are opt-in via `@rbac/schemas`; importing `@rbac/core` does not load Zod. The `RBACOptions` object requires `roles` and also accepts these optional configuration fields:

| Option | Description |
| --- | --- |
| `enableLogger?` | Enable or disable authorization logging. |
| `logger?` | Custom `(role, operation, result, colorsEnabled?) => void` logger. |
| `colors?` | Force ANSI color on/off; otherwise use the default detection. |

Avoid exposing credentials or sensitive request parameters through custom logs. Database connection errors may propagate from adapters; in-memory permission checks deny access when their conditions fail.


## Development and contributing

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run test:package
```

Use Node.js 22.14.0 for repository development (see `.nvmrc`). Read [`CONTRIBUTING.md`](CONTRIBUTING.md) for development conventions and documentation authoring.

## License

[MIT](LICENSE) © RBAC contributors.
