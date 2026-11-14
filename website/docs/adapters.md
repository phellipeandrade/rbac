---
id: adapters
title: Database adapters and tenants
---

# Persist role definitions

`RoleAdapter<P>` defines `getRoles(tenantId?)`, `addRole(name, role, tenantId?)`, and `updateRoles(roles, tenantId?)`. MongoDB, MySQL, and PostgreSQL implementations expose this interface from `@rbac/rbac/adapters`. Database drivers are optional and loaded when the corresponding adapter is constructed or connects.

| Adapter | Install driver | Constructor options |
| --- | --- | --- |
| `MongoRoleAdapter` | `npm install mongodb` | `uri`, `dbName`, `collection`, `columns?` |
| `MySQLRoleAdapter` | `npm install mysql2` | `table`, `uri?` or `config?`, `columns?` |
| `PostgresRoleAdapter` | `npm install pg` | `table`, PostgreSQL `Client` options (such as `connectionString`), `columns?` |

## Load a tenant

```ts
import { createTenantRBAC } from '@rbac/rbac';
import { PostgresRoleAdapter } from '@rbac/rbac/adapters';

const adapter = new PostgresRoleAdapter({
  connectionString: process.env.DATABASE_URL,
  table: 'public.rbac_roles'
});

await adapter.updateRoles({ reader: { can: ['documents:read'] } }, 'acme');
const auth = await createTenantRBAC(adapter, 'acme');
console.log(await auth.can('reader', 'documents:read')); // true
```

`createTenantRBAC(adapter, tenantId, config?)` reads the tenant's roles **once** and constructs an independent in-memory RBAC instance. Passing no tenant ID to adapter methods uses the tenant named `default`. Specify the tenant consistently for every read/write. Your application is responsible for authenticating and validating the tenant ID.

## Table and column mapping

The storage must already exist. SQL expects name, serialized role, and tenant ID columns. Default SQL names are `name`, `role`, and `tenant_id`; MongoDB uses `name`, `role`, and `tenantId`. Change them with `columns`:

```ts
import { MySQLRoleAdapter } from '@rbac/rbac/adapters';

const adapter = new MySQLRoleAdapter({
  table: 'rbac_roles',
  uri: process.env.MYSQL_URL,
  columns: { name: 'role_name', role: 'definition', tenantId: 'tenant_key' }
});
```

SQL identifiers are validated and dialect-quoted; runtime values are bound parameters. Table names can be schema-qualified when supported. `getRoles()` returns an object of role definitions; `addRole()` inserts a record, while `updateRoles()` persists an upsert-like replacement according to the adapter dialect. Store only serializable rules in SQL: functions and closures cannot survive `JSON.stringify`; rebuild dynamic `when` predicates in application code after loading, or keep them in code. MongoDB also cannot persist executable functions as portable policies.

For complete options and signatures, see the [generated API reference](./api/index.md).
