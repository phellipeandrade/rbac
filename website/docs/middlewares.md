---
id: middlewares
title: Express, NestJS and Fastify
---

# Protect routes

Framework integrations are exported at `@rbac/rbac/middlewares` (and from the root). By default, middleware reads `req.role`, checks the requested operation, and responds `403 Forbidden` when denied. **Supply a trusted role** from server-side authentication; never treat a client-provided role as verified.

## Express

```ts
import express from 'express';
import RBAC from '@rbac/rbac';
import { createExpressMiddleware } from '@rbac/rbac/middlewares';

const app = express();
const auth = RBAC()({ reader: { can: ['posts:read'] } });
const requirePermission = createExpressMiddleware(auth);

// Demo role only: replace with a role verified by your authentication layer.
app.get('/posts', requirePermission('posts:read', { getRole: () => 'reader' }), (_req, res) => {
  res.send('Authorized');
});
app.listen(3000);
```

Install Express with `npm install express` (and `npm install -D @types/express` for TypeScript). The fixed `reader` role is for demonstration **only**; in production, return the verified role of the authenticated user. To customize extraction, pass `getRole(req)`, `getParams(req)`, or `onDenied(req, res, next)` as the second argument to `requirePermission`. Caught errors are forwarded to `next(err)`.

## Fastify

```ts
import Fastify from 'fastify';
import RBAC from '@rbac/rbac';
import { createFastifyMiddleware } from '@rbac/rbac/middlewares';

const fastify = Fastify();
const auth = RBAC()({ reader: { can: ['posts:read'] } });
const requirePermission = createFastifyMiddleware(auth);
fastify.get('/posts', {
  preHandler: requirePermission('posts:read', {
    // Demo role only: obtain the role from a verified server-side principal.
    getRole: () => 'reader'
  })
}, async () => ({ ok: true }));
await fastify.listen({ port: 3000 });
```

Install Fastify with `npm install fastify`. Authenticate earlier in the request lifecycle and replace the fixed role. A denied request defaults to 403. The optional `onDenied(req, reply)` can be async.

## NestJS

`createNestMiddleware(auth)(operation, options?)` returns a Nest-compatible `(req, res, next)` middleware. `createNestGuard(auth)(operation, options?)` returns an object implementing `canActivate(context): Promise<boolean>`; Nest handles a `false` result according to its guard contract. Both accept `getRole` and `getParams`. Nest middleware also supports `onDenied`.

For exact types, see the [API reference](./api/index.md).
