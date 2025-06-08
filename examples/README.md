`./configuredRBAC.ts`:

```ts
import rbac from '@rbac/rbac';

const rbacConfig = {
  enableLogger: false
};

export const configuredRBAC = rbac(rbacConfig);
```

`./RBAC.ts`:

```ts
import configuredRBAC from './configuredRBAC';

import type { Roles } from '@rbac/rbac';

const roles: Roles = {
  user: {
    can: ['products:find']
  },
  supervisor: {
    can: [{ name: 'products:find', when: PromiseThatReturnsTruthyOrFalsyValue }],
    inherits: ['user']
  },
  admin: {
    can: [{ name: 'products:delete', when: FunctionThatReturnsTruthyOrFalsyValue }],
    inherits: ['supervisor']
  },
  superadmin: {
    can: ['products:find', 'products:edit', 'products:delete']
  }
};

export const RBAC = configuredRBAC(roles);
```

`./example.ts`:

```ts
import RBAC from './RBAC';

const myUser = {
  name: 'John Doe',
  role: 'user',
  registered: false
}

// Async / Await style
const result = await RBAC.can(myUser.role, 'products:find', myUser.registered);

// Promise style
RBAC.can(myUser.role, 'products:find')
 .then(result => {
   doSomething(result);
 })
  .catch(error => {
    somethingWentWrong();
  });
```

`./updateRoles.ts`:

```ts
import rbac from '@rbac/rbac';
import type { Roles } from '@rbac/rbac';
import {
  USER,
  PRODUCTS_FIND,
  PRODUCTS_UPDATE,
  PRODUCTS_CREATE
} from './constants';

const baseRoles: Roles = {
  [USER]: { can: [PRODUCTS_FIND] }
};

const RBAC = rbac()(baseRoles);

RBAC.addRole('editor', { can: [PRODUCTS_UPDATE], inherits: [USER] });
await RBAC.can('editor', PRODUCTS_UPDATE); // true

RBAC.updateRoles({
  [USER]: { can: [PRODUCTS_FIND, PRODUCTS_CREATE] }
});
await RBAC.can(USER, PRODUCTS_CREATE); // true
```

`./mongodbAdapter.ts`:

```ts
import rbac, { MongoRoleAdapter } from '@rbac/rbac';

async function run(): Promise<void> {
  const adapter = new MongoRoleAdapter({
    uri: 'mongodb://localhost:27017',
    dbName: 'rbac',
    collection: 'roles',
    columns: { name: 'rname', role: 'rdef', tenantId: 'tid' }
  });

  const roles = await adapter.getRoles();
  const RBAC = rbac()(roles);

  await RBAC.can('user', 'products:find');
}

run().catch(console.error);
```

`./mysqlAdapter.ts`:

```ts
import rbac, { MySQLRoleAdapter } from '@rbac/rbac';

async function run(): Promise<void> {
  const adapter = new MySQLRoleAdapter({
    uri: 'mysql://user:pass@localhost/rbac',
    table: 'roles',
    columns: { name: 'rname', role: 'rdef', tenantId: 'tid' }
  });

  const roles = await adapter.getRoles();
  const RBAC = rbac()(roles);

  await RBAC.can('user', 'products:find');
}

run().catch(console.error);
```

`./postgresAdapter.ts`:

```ts
import rbac, { PostgresRoleAdapter } from '@rbac/rbac';

async function run(): Promise<void> {
  const adapter = new PostgresRoleAdapter({
    host: 'localhost',
    user: 'user',
    password: 'pass',
    database: 'rbac',
    table: 'roles',
    columns: { name: 'rname', role: 'rdef', tenantId: 'tid' }
  });

  const roles = await adapter.getRoles();
  const RBAC = rbac()(roles);

  await RBAC.can('user', 'products:find');
}

run().catch(console.error);
```


`./multiTenant.ts`:

```ts
import rbac, { MongoRoleAdapter, createTenantRBAC } from '@rbac/rbac';

async function run(): Promise<void> {
  const adapter = new MongoRoleAdapter({
    uri: 'mongodb://localhost:27017',
    dbName: 'rbac',
    collection: 'roles'
  });

  await adapter.addRole('user', { can: ['products:find'] }, 'tenant-a');
  const rbacTenantA = await createTenantRBAC(adapter, 'tenant-a');
  await rbacTenantA.can('user', 'products:find'); // true
}

run().catch(console.error);
```
