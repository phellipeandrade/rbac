---
id: middlewares
title: Express, NestJS e Fastify
---

# Proteja rotas

Instale cada integração separadamente: `@rbac/express`, `@rbac/fastify` ou `@rbac/nestjs`, além de `@rbac/core`. Por padrão, o middleware lê `req.role`, verifica a operação e responde `403 Forbidden` se não houver permissão. **Defina uma role confiável** após autenticação no servidor; nunca confie diretamente em uma role enviada pelo cliente.

## Express

```ts
import express from 'express';
import { createRBAC } from '@rbac/core';
import { createExpressMiddleware } from '@rbac/express';

const app = express();
const auth = createRBAC({ roles: { reader: { can: ['posts:read'] } } });
const requirePermission = createExpressMiddleware(auth);

// Role apenas para demonstração: substitua por uma role autenticada no servidor.
app.get('/posts', requirePermission('posts:read', { getRole: () => 'reader' }), (_req, res) => {
  res.send('Authorized');
});
app.listen(3000);
```

Instale com `npm install express` (e `npm install -D @types/express` para TypeScript). A role fixa `reader` é **apenas demonstrativa**; em produção, retorne a role autenticada do usuário. Para personalizar a extração, informe `getRole(req)`, `getParams(req)` ou `onDenied(req, res, next)` como segundo argumento de `requirePermission`. Erros capturados são encaminhados por `next(err)`.

## Fastify

```ts
import Fastify from 'fastify';
import { createRBAC } from '@rbac/core';
import { createFastifyMiddleware } from '@rbac/fastify';

const fastify = Fastify();
const auth = createRBAC({ roles: { reader: { can: ['posts:read'] } } });
const requirePermission = createFastifyMiddleware(auth);
fastify.get('/posts', {
  preHandler: requirePermission('posts:read', {
    // Role demonstrativa: leia a role de um usuário autenticado no servidor.
    getRole: () => 'reader'
  })
}, async () => ({ ok: true }));
await fastify.listen({ port: 3000 });
```

Instale com `npm install fastify`. Autentique antes dessa etapa e substitua a role fixa. O padrão para negação é 403. O `onDenied(req, reply)` opcional pode ser assíncrono.

## NestJS

`createNestMiddleware(auth)(operation, options?)` retorna middleware `(req, res, next)` compatível com Nest. `createNestGuard(auth)(operation, options?)` retorna um objeto com `canActivate(context): Promise<boolean>`; o Nest trata `false` conforme o contrato de guards. Ambos aceitam `getRole` e `getParams`. O middleware Nest também aceita `onDenied`.

Confira os tipos na [referência de API](./api/index.md).
