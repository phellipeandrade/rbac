---
id: installation
title: Instalação e início rápido
sidebar_position: 2
---

# Instalar o RBAC

Utilize **Node.js 22.12.0 ou superior** (o repositório fixa a versão 22.14.0).

```bash
npm install @rbac/rbac
```

Para ESM com TypeScript, crie `index.ts`:

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

Em JavaScript/CommonJS:

```js
const RBAC = require('@rbac/rbac');
const auth = RBAC()({ guest: { can: ['posts:read'] } });
auth.can('guest', 'posts:read').then(console.log); // true
```

O entrypoint principal exporta `createTenantRBAC`, adapters, middlewares e tipos públicos. Os subpaths `/adapters`, `/middlewares`, `/helpers`, `/schemas` e `/roles.schema` também estão disponíveis. Importar o pacote principal não carrega o Zod antecipadamente.

## Integrações opcionais

Os drivers dos bancos são instalados **apenas quando necessários**:

```bash
npm install mongodb  # MongoRoleAdapter
npm install mysql2   # MySQLRoleAdapter
npm install pg       # PostgresRoleAdapter
```

Utilize os middlewares com o framework correspondente instalado na aplicação. O núcleo do RBAC não depende de Express, NestJS ou Fastify em tempo de execução.

Próximos passos: [conceitos](./concepts.md) e [configuração de roles](./roles-permissions.md).
