---
id: migration-3-to-4
title: Guia de migração — 3.x para 4.x
---

# Migrar do RBAC 3.x para o 4.x

A versão 4 reorganiza a distribuição npm e substitui a factory curried padrão por **`createRBAC({ roles, ...options })`**. A autorização continua negando por padrão. Esta versão major exige atualizar os imports e a inicialização em conjunto.

## 1. Instale os novos pacotes

Utilize **Node.js 22.12.0 ou superior**. Instale o núcleo e apenas as integrações necessárias à aplicação:

```bash
npm install @rbac/core@^4
npm install @rbac/adapters@^4    # opcional: MongoDB, MySQL, PostgreSQL
npm install @rbac/express@^4     # opcional: middleware Express
npm install @rbac/fastify@^4     # opcional: preHandler Fastify
npm install @rbac/nestjs@^4      # opcional: middleware/guard NestJS
npm install @rbac/schemas@^4     # opcional: schemas Zod
```

Para adapters, instale também o driver correspondente (`mongodb`, `mysql2` ou `pg`). Concluída a migração, remova `@rbac/rbac` das dependências da aplicação. O pacote antigo e suas versões publicadas são artefatos npm independentes; não há alias de compatibilidade na v4.

| Import v3 | Import v4 | Exports principais |
| --- | --- | --- |
| `@rbac/rbac` | `@rbac/core` | `createRBAC`, `RBACOptions`, `RBACEngine`, tipos de role/condição |
| `@rbac/rbac/helpers` | `@rbac/core/helpers` | `callbackWhen`, helpers |
| `@rbac/rbac/adapters` | `@rbac/adapters` | `createTenantRBAC`, adapters, `RoleAdapter` |
| `@rbac/rbac/middlewares` | `@rbac/express`, `@rbac/fastify`, `@rbac/nestjs` | Factories de cada framework |
| `@rbac/rbac/schemas` ou `@rbac/rbac/roles.schema` | `@rbac/schemas` | Schemas Zod |

Subpaths antigos como `@rbac/core/adapters` e `@rbac/core/middlewares` **não existem**. `@rbac/core/helpers` é o subpath oficial para helpers.

## 2. Atualize a factory

**Antes (v3):**

```text
import RBAC from '@rbac/rbac';
const auth = RBAC({ enableLogger: false })({
  viewer: { can: ['documents:read'] },
  editor: { inherits: ['viewer'], can: ['documents:edit'] }
});
```

**Depois (v4):**

```ts
import { createRBAC, type RBACOptions, type RBACEngine } from '@rbac/core';

const options: RBACOptions = {
  enableLogger: false,
  roles: {
    viewer: { can: ['documents:read'] },
    editor: { inherits: ['viewer'], can: ['documents:edit'] }
  }
};

const auth: RBACEngine = createRBAC(options);
console.log(await auth.can('editor', 'documents:read')); // true
console.log(await auth.can('viewer', 'documents:edit')); // false
```

A factory padrão `RBAC` foi removida; use o export **nomeado**. `RBACConfig` ainda descreve as opções de logging, enquanto **`RBACOptions<P>`** agrega a propriedade obrigatória `roles`. `RBACEngine<P>` representa a instância retornada. Informe o parâmetro genérico quando condições `when` dependem de contexto tipado:

```ts
import { createRBAC } from '@rbac/core';
import { callbackWhen } from '@rbac/core/helpers';

type Context = { ownerId: string; userId: string };
const auth = createRBAC<Context>({
  roles: { author: { can: [
    { name: 'documents:edit', when: (params: Context) => params.ownerId === params.userId },
    { name: 'documents:review', when: callbackWhen<Context>((params, done) => done(null, params.userId === params.ownerId)) }
  ] } }
});
console.log(await auth.can('author', 'documents:edit', { ownerId: '1', userId: '1' }));
```

`can(role, operation, params?)` ainda retorna `Promise<boolean>`. `addRole()` e `updateRoles()` continuam reconstruindo a hierarquia. Roles desconhecidas, condições rejeitadas e operações sem correspondência continuam sendo negadas.

## 3. Migre integrações e módulos

Importe cada integração pelo respectivo pacote:

```ts
import { createRBAC } from '@rbac/core';
import { createExpressMiddleware } from '@rbac/express';
import { createFastifyMiddleware } from '@rbac/fastify';
import { createNestMiddleware, createNestGuard } from '@rbac/nestjs';
import { createTenantRBAC, MongoRoleAdapter } from '@rbac/adapters';
import { rolesSchema } from '@rbac/schemas';

const auth = createRBAC({ roles: { viewer: { can: ['documents:read'] } } });
const expressPermission = createExpressMiddleware(auth);
const fastifyPermission = createFastifyMiddleware(auth);
const nestPermission = createNestMiddleware(auth);
const nestGuard = createNestGuard(auth);
const parsedRoles = rolesSchema.parse({ viewer: { can: ['documents:read'] } });
void [expressPermission, fastifyPermission, nestPermission, nestGuard, parsedRoles];
// createTenantRBAC(adapter, tenantId, options?) carrega as roles de um tenant.
void [createTenantRBAC, MongoRoleAdapter];
```

Em CommonJS, utilize `const { createRBAC } = require('@rbac/core')`. Em ESM, utilize `import { createRBAC } from '@rbac/core'`. A v4 oferece declarações compatíveis com NodeNext ESM e CommonJS, e ambos os entrypoints compartilham uma implementação subjacente.

Os frameworks ainda exigem extrair a role de uma identidade autenticada no servidor. As conexões dos adapters e identificadores de tenant continuam explícitos; não altere os limites de isolamento ao migrar os imports. Definições de roles salvas no banco não serializam closures arbitrárias.

## 4. Valide antes do deploy

1. Compile o TypeScript e teste os exports reais da v4, incluindo consumidores CommonJS e ESM.
2. Verifique acessos **permitidos e negados** com grants diretos, herdados, glob/regex, roles desconhecidas e condições diferentes por parâmetro.
3. Confirme que condições rejeitadas negam acesso e que atualizações de roles invalidam imediatamente os caches de matching.
4. Teste tenants separadamente, identificadores SQL, mapeamentos de colunas personalizados e parâmetros vinculados.
5. Confirme que Express, Fastify e Nest utilizam roles autenticadas, tratam recusas e propagam falhas inesperadas.

Consulte a [referência de API atual](./api/index.md), o [guia de adapters](./adapters.md) e o [guia de middlewares](./middlewares.md). A depreciação de `@rbac/rbac` deve apontar para este guia **após** a publicação da v4; nenhuma alteração no registro npm é executada nesta etapa.
