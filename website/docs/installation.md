---
id: installation
title: Installation and quick start
sidebar_position: 2
---

# Install RBAC

Use **Node.js 22.12.0+** (the repository pins 22.14.0).

```bash
npm install @rbac/core
```

For native ESM with TypeScript, create `index.ts`:

```ts
import { createRBAC } from '@rbac/core';

const authorization = createRBAC({ roles: {
  guest: { can: ['posts:read'] },
  contributor: { inherits: ['guest'], can: ['posts:create'] }
} });

async function main() {
  const allowed = await authorization.can('contributor', 'posts:read');
  console.log(allowed); // true
}

void main();
```

For JavaScript/CommonJS:

```js
const { createRBAC } = require('@rbac/core');
const auth = createRBAC({ roles: { guest: { can: ['posts:read'] } } });
auth.can('guest', 'posts:read').then(console.log); // true
```

`@rbac/core` exports `createRBAC`, `RBACOptions`, `RBACEngine`, and the role/condition types. Helpers such as `callbackWhen` are available at `@rbac/core/helpers`. Optional features are separate npm packages: `@rbac/adapters`, `@rbac/express`, `@rbac/fastify`, `@rbac/nestjs`, and `@rbac/schemas`. The core does not load Zod or database/framework packages.

## Optional integrations

Install `@rbac/adapters` and the specific database driver you use:

```bash
npm install @rbac/adapters
npm install mongodb  # MongoRoleAdapter
npm install mysql2   # MySQLRoleAdapter
npm install pg       # PostgresRoleAdapter
```

Install the integration package for your framework (`@rbac/express`, `@rbac/fastify`, or `@rbac/nestjs`) alongside the framework itself. Install `@rbac/schemas` for Zod validation. See the [v3 → v4 migration guide](./migration-3-to-4.md).

Next: [concepts](./concepts.md) and [role configuration](./roles-permissions.md).
