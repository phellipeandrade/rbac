# Migrating Zod schemas to v4

Replace `@rbac/rbac/schemas` or `@rbac/rbac/roles.schema` with `@rbac/schemas`. Install `npm install @rbac/schemas` (Zod is a runtime dependency only of this optional package).

```ts
import {rolesSchema} from '@rbac/schemas';
const parsed = rolesSchema.parse({viewer: {can: ['posts:read']}});
```

See the [full v3 → v4 guide](https://phellipeandrade.github.io/rbac/docs/migration-3-to-4/).
