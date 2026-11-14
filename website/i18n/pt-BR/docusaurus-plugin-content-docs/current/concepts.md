---
id: concepts
title: Conceitos fundamentais
---

# Como a autorização funciona

**Usuário**: identificado pela aplicação. O RBAC não mantém contas ou vínculos de usuários. **Role**: definição nomeada, como `editor`. **Operação**: string definida pela aplicação, como `invoices:approve`. **Permissão (grant)**: entrada no array `can` de uma role. **Condição**: regra opcional `when`, avaliada com parâmetros da requisição. **Herança**: soma de permissões obtidas de outra role.

```ts
import { createRBAC } from '@rbac/core';

type RequestContext = { ownerId: string; userId: string };

const auth = createRBAC<RequestContext>({ roles: {
  reader: { can: ['items:read'] },
  author: {
    inherits: ['reader'],
    can: [{ name: 'items:edit', when: ({ ownerId, userId }: RequestContext) => ownerId === userId }]
  }
} });

console.log(await auth.can('author', 'items:read')); // true
console.log(await auth.can('author', 'items:edit', { ownerId: 'a', userId: 'b' })); // false
```

O motor procura permissões exatas e padrões compatíveis, inclui permissões herdadas e avalia as condições capazes de autorizar a operação solicitada. Permissões compatíveis combinam com semântica **OU**. Sem permissão bem-sucedida, o resultado é `false`. Exceções ou rejeições em condições negam a respectiva permissão.

## Formato da API

| Membro | Finalidade |
| --- | --- |
| `createRBAC<P>({ roles, ...options })` | Cria uma instância em memória tipada pelo contexto `P`. |
| `can(role, operation, params?)` | Verifica a autorização como `Promise<boolean>`. |
| `addRole(name, definition)` | Adiciona ou substitui uma role imediatamente. |
| `updateRoles(definitions)` | Mescla definições por nome e invalida os caches de permissão. |

O genérico `P` descreve o contexto de autorização; o RBAC não armazena um objeto de usuário. Veja [segurança](./security-performance.md) para orientações sobre roles confiáveis.
