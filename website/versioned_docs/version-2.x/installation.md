---
id: installation
title: Install RBAC 2.x
---

# Install the 2.x package

For maintenance of an existing 2.x application, pin its final published release:

```bash
npm install @rbac/rbac@2.2.3
```

The published 2.2.3 npm package includes TypeScript declarations (`lib/index.d.ts`) and a CommonJS entry (`lib/index.js`). Its export map directs both `import` and `require` to that same JavaScript entry.

```ts
import RBAC from '@rbac/rbac';

const auth = RBAC()({
  visitor: { can: ['posts:view'] },
  member: { inherits: ['visitor'], can: ['posts:create'] }
});

console.log(await auth.can('member', 'posts:view')); // true
```

Version 2.2.3 accepts the optional `RBACConfig` fields `logger`, `enableLogger`, and `colors`. The root entry also exposes `createTenantRBAC`, middleware helpers, and validation schemas. The 2.x export map exposes **only the package root**: unlike 3.x, dedicated subpaths such as `@rbac/rbac/adapters` are not part of its published export contract.

The old release is retained as a reference; current Node.js support is documented for [3.x](./migration.md).
