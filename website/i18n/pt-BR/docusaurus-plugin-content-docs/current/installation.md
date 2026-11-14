---
id: installation
title: Instalação e início rápido
sidebar_position: 2
---

# Instalar o RBAC

Utilize **Node.js 22.12.0 ou superior** (o repositório fixa a versão 22.14.0).

```bash
npm install @rbac/core
```

Para ESM com TypeScript, crie `index.ts`:

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

Em JavaScript/CommonJS:

```js
const { createRBAC } = require('@rbac/core');
const auth = createRBAC({ roles: { guest: { can: ['posts:read'] } } });
auth.can('guest', 'posts:read').then(console.log); // true
```

O `@rbac/core` exporta `createRBAC`, `RBACOptions`, `RBACEngine` e os tipos de roles e condições. Helpers como `callbackWhen` estão em `@rbac/core/helpers`. Recursos opcionais usam pacotes independentes: `@rbac/adapters`, `@rbac/express`, `@rbac/fastify`, `@rbac/nestjs` e `@rbac/schemas`. O núcleo não carrega Zod nem integrações de banco/framework.

## Integrações opcionais

Instale `@rbac/adapters` e apenas o driver do banco utilizado:

```bash
npm install @rbac/adapters
npm install mongodb  # MongoRoleAdapter
npm install mysql2   # MySQLRoleAdapter
npm install pg       # PostgresRoleAdapter
```

Instale o pacote da integração correspondente (`@rbac/express`, `@rbac/fastify` ou `@rbac/nestjs`) junto ao framework. Para schemas Zod, instale `@rbac/schemas`. Consulte o [guia de migração da v3 para v4](./migration-3-to-4.md).

Próximos passos: [conceitos](./concepts.md) e [configuração de roles](./roles-permissions.md).
