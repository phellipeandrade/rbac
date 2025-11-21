# Basic Usage

This section shows how to configure RBAC, model permissions, and integrate the library into common application layers.

## Configure RBAC

Create an instance by passing configuration and a role map. Configuration accepts a custom logger and a `enableLogger` flag to turn logging on or off.

```ts
import RBAC from '@rbac/rbac';

const rbac = RBAC({ enableLogger: true })({
  guest: { can: ['products:find'] }
});
```

## Define roles and permissions

A role definition accepts:

- `can`: An array of strings or objects with a `name` and optional `when` guard. Strings match directly, and patterns can use glob wildcards or regular expressions.
- `inherits`: An optional array of roles to pull permissions from.

```ts
const rbac = RBAC()({
  user: { can: ['products:find'] },
  supervisor: {
    can: [
      { name: 'products:edit', when: () => true },
      { name: 'products:*' } // wildcard
    ],
    inherits: ['user']
  }
});
```

`when` guards can be synchronous, async, a returned Promise, or a callback. They receive the `params` object passed to `can`.

```ts
const rbac = RBAC()({
  auditor: {
    can: [
      { name: 'products:audit:callback', when: (_params, done) => done(null, true) },
      { name: 'products:audit:async', when: async () => true },
      { name: 'products:audit:promise', when: Promise.resolve(true) }
    ]
  }
});
```

## Check permissions

The `can` helper resolves inheritance, matches exact operations, globs, or regexes, and evaluates conditional guards when present:

```ts
await rbac.can('supervisor', 'products:find');
await rbac.can('supervisor', 'products:create');
await rbac.can('auditor', /products:audit/);
await rbac.can('auditor', 'products:audit:async', { requestId: '42' });
```

## Update roles at runtime

Add or merge role definitions without rebuilding your application:

```ts
rbac.addRole('editor', { can: ['products:update'], inherits: ['user'] });
rbac.updateRoles({
  user: { can: ['products:find', 'products:share'] }
});
```

## Persist and load roles with adapters

Use the optional adapters to store roles in your database. Each adapter supports a customizable table/collection schema and an optional `tenantId` for multi-tenancy.

```ts
import { MongoRoleAdapter, MySQLRoleAdapter, PostgresRoleAdapter } from '@rbac/rbac/adapters';

const mongoAdapter = new MongoRoleAdapter({
  uri: 'mongodb://localhost:27017',
  dbName: 'mydb',
  collection: 'roles'
});

const mysqlAdapter = new MySQLRoleAdapter({
  uri: 'mysql://user:pass@localhost:3306/app',
  table: 'roles'
});

const pgAdapter = new PostgresRoleAdapter({
  connectionString: 'postgres://user:pass@localhost:5432/app',
  table: 'roles'
});
```

Adapters expose `getRoles`, `addRole`, and `updateRoles` to manage definitions in storage.

## Multi-tenant RBAC

Scope RBAC to a specific tenant by loading role definitions with a `tenantId`:

```ts
import { createTenantRBAC, MongoRoleAdapter } from '@rbac/rbac';

const adapter = new MongoRoleAdapter({
  uri: 'mongodb://localhost:27017',
  dbName: 'mydb',
  collection: 'roles'
});

const rbacTenantA = await createTenantRBAC(adapter, 'tenant-a');
await rbacTenantA.can('user', 'products:find');
```

## Web framework middleware

Guard routes using the built-in middleware factories for Express, NestJS, and Fastify. Each factory accepts optional callbacks to extract the role and params or to override the default denied response.

```ts
import RBAC, { createExpressMiddleware } from '@rbac/rbac';

const rbac = RBAC({ enableLogger: false })({
  user: { can: ['products:find'] }
});

const canFindProducts = createExpressMiddleware(rbac)('products:find');
app.get('/products', canFindProducts, handler);
```

Swap `createExpressMiddleware` for `createNestMiddleware` or `createFastifyMiddleware` to integrate with other frameworks.
