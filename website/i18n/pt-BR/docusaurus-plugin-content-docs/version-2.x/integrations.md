---
id: integrations
title: Integrações (2.x)
---

# Middlewares e persistência na 2.2.3

O código e as declarações 2.2.3 incluem factories de middleware para Express, NestJS e Fastify, a interface `RoleAdapter` e implementações para MongoDB, MySQL e PostgreSQL.

A **entrada raiz** exporta explicitamente as factories de middleware:

```ts
import {
  createExpressMiddleware,
  createNestMiddleware,
  createFastifyMiddleware
} from '@rbac/rbac';
```

Ela também exporta `createTenantRBAC`, que carrega papéis de um adapter para um tenant:

```ts
import { createTenantRBAC } from '@rbac/rbac';

// O adapter deve implementar getRoles, addRole e updateRoles.
// const auth = await createTenantRBAC(adapter, 'tenant-a');
```

**Limitação de empacotamento:** o `package.json` publicado na 2.2.3 contém apenas `"."` em `exports`, embora os arquivos dos adapters estejam em `lib/adapters`. Por isso, imports profundos dos adapters podem falhar em ambientes que respeitam o mapa de exports. As declarações da raiz também não reexportam as classes. Verifique o comportamento da integração existente; a 3.x oferece [subcaminhos oficiais para adapters](/rbac/pt-BR/docs/adapters/).

O [guia de migração](./migration.md) explica exports, instalação dos drivers, validação de identificadores SQL e os contratos atuais dos middlewares.
