---
id: api
title: Referência da API do RBAC 2.x
---

# Referência da API — 2.2.3

Este conteúdo é uma **referência histórica baseada nas declarações TypeScript publicadas na 2.2.3**, separada da API 3.x gerada por TypeDoc.

| API | Contrato na 2.2.3 |
| --- | --- |
| `RBAC<P>(config?)(roles)` | Cria a instância de autorização. |
| `auth.can(role, operation, params?)` | Retorna `Promise<boolean>`; operação aceita `string \| RegExp`. |
| `auth.updateRoles(roles)` | Atualiza os papéis em memória. |
| `auth.addRole(name, role)` | Adiciona ou substitui um papel. |
| `Role<P>` | `{ can: Array<string \| { name, when }>, inherits?: string[] }`. |
| `When<P>` | Booleano, promise, predicado ou callback Node.js. |
| `RBACConfig` | `logger?`, `enableLogger?`, `colors?`. |
| `createTenantRBAC(adapter, tenantId, config?)` | Cria uma instância com papéis do tenant. |
| `createExpressMiddleware`, `createNestMiddleware`, `createFastifyMiddleware` | Factories exportadas pela raiz do pacote. |

```ts
import RBAC from '@rbac/rbac';

const auth = RBAC<{ approved: boolean }>()({
  reviewer: { can: [{ name: 'reviews:accept', when: ({ approved }) => approved }] }
});

console.log(await auth.can('reviewer', 'reviews:accept', { approved: true })); // true
```

O mapa de exports da 2.2.3 contém somente a raiz. Subcaminhos como `@rbac/rbac/helpers`, `/schemas` e o guard NestJS integram a [3.x](/rbac/pt-BR/docs/api/), não esta versão histórica.
