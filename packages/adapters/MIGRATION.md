# Migrating database adapters to v4

Replace `@rbac/rbac/adapters` with `@rbac/adapters`. Install with `npm install @rbac/core @rbac/adapters` and install only your selected database driver (`mongodb`, `mysql2`, or `pg`).

```ts
import {MongoRoleAdapter, createTenantRBAC} from '@rbac/adapters';
const adapter = new MongoRoleAdapter({uri: 'mongodb://localhost', dbName: 'app', collection: 'roles'});
const auth = await createTenantRBAC(adapter, 'tenant-a');
```

The core no longer includes database integrations. See the [full v3 → v4 guide](https://phellipeandrade.github.io/rbac/docs/migration-3-to-4/).
