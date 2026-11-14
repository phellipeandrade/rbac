---
id: installation
title: Install RBAC 1.x
---

# Install the 1.x package

Pin the last release of the major series when maintaining a legacy application:

```bash
npm install @rbac/rbac@1.1.0
```

The 1.1.0 npm package exposes a JavaScript bundle through its `main` entry point. Use CommonJS to match the published package:

```js
const RBAC = require('@rbac/rbac');

const auth = RBAC()({
  visitor: { can: ['posts:read'] },
  author: { inherits: ['visitor'], can: ['posts:create'] }
});

auth.can('author', 'posts:read').then(console.log); // true
```

The factory accepts an optional configuration object. The published 1.x README documents `enableLogger` and `logger` for logging decisions. No declaration entry point is published for TypeScript consumers.

This site preserves the historical API; it does not imply that 1.x is supported on modern Node.js versions. See [migrating from 1.x](./migration.md) for an upgrade path.
