---
id: intro
title: Visão geral do RBAC 2.x
---

# RBAC 2.x

Esta é a **documentação histórica da linha 2.x**, baseada na última versão publicada no npm, **2.2.3**. Abrange as versões 2.0.0–2.2.3; algumas funcionalidades podem não existir nas primeiras versões menores da série.

**Descontinuada:** a versão 2.x não recebe manutenção. Utilize a [3.x (latest)](/rbac/pt-BR/docs/intro/) em novos projetos e o [guia de migração 2.x → 3.x](/rbac/pt-BR/docs/migration-2-to-3/) para aplicações existentes.

Comparada à 1.x, a 2.x foi implementada em TypeScript e passou a distribuir declarações `.d.ts`. Ela oferece atualização de papéis em execução, permissões condicionais, adapters de bancos de dados, middlewares Express/NestJS/Fastify e carregamento de papéis por tenant.

```ts
import RBAC from '@rbac/rbac';

const auth = RBAC<{ owner: boolean }>()({
  viewer: { can: ['documents:read'] },
  editor: {
    inherits: ['viewer'],
    can: [{ name: 'documents:edit', when: ({ owner }) => owner }]
  }
});

console.log(await auth.can('editor', 'documents:read')); // true
console.log(await auth.can('editor', 'documents:edit', { owner: true })); // true
```

Consulte [instalação](./installation.md), [papéis](./roles-permissions.md), [condições](./conditions.md), [integrações](./integrations.md) e a [referência da API 2.2.3](./api.md).
