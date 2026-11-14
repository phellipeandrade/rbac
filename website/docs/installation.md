---
id: installation
title: Installation and quick start
sidebar_position: 2
---

# Install RBAC

Use **Node.js 22.12.0+** (the repository pins 22.14.0).

```bash
npm install @rbac/rbac
```

For native ESM with TypeScript, create `index.ts`:

```ts
import RBAC from '@rbac/rbac';

const authorization = RBAC()({
  guest: { can: ['posts:read'] },
  contributor: { inherits: ['guest'], can: ['posts:create'] }
});

async function main() {
  const allowed = await authorization.can('contributor', 'posts:read');
  console.log(allowed); // true
}

void main();
```

For JavaScript/CommonJS:

```js
const RBAC = require('@rbac/rbac');
const auth = RBAC()({ guest: { can: ['posts:read'] } });
auth.can('guest', 'posts:read').then(console.log); // true
```

The root entry point exports `createTenantRBAC`, adapter and middleware names, plus public types. Dedicated subpaths (`/adapters`, `/middlewares`, `/helpers`, `/schemas`, `/roles.schema`) are available when you need them. Importing the root package does not load Zod eagerly.

## Optional integrations

Database drivers are installed **only** when needed:

```bash
npm install mongodb  # MongoRoleAdapter
npm install mysql2   # MySQLRoleAdapter
npm install pg       # PostgresRoleAdapter
```

Use framework integrations with the matching framework installed in your application. RBAC core is independent of Express, NestJS, and Fastify runtime packages.

Next: [concepts](./concepts.md) and [role configuration](./roles-permissions.md).
