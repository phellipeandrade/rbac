---
id: migration
title: Migração de integrações existentes
---

# Migre uma integração existente

Ao atualizar uma versão antiga do RBAC, revise as chamadas em JavaScript e os caminhos de importação. O pacote atual é distribuído como `@rbac/rbac`, com entradas CommonJS e ESM.

## Alterações entre versões principais

A versão 2 introduziu a implementação em TypeScript, atualizações de roles em execução, adapters para MongoDB/MySQL/PostgreSQL, middlewares e funções de autorização por tenant. A versão 3 exige **Node.js 22.12.0+**, move os schemas Zod para os subcaminhos opcionais `@rbac/rbac/schemas` e `@rbac/rbac/roles.schema` e rejeita identificadores inválidos de tabelas ou colunas SQL na construção do adapter. Revise essas alterações antes de atualizar integrações antigas.

## Revise sua integração

1. Consulte o [changelog](https://github.com/phellipeandrade/rbac/blob/master/CHANGELOG.md) para alterações que afetem sua versão.
2. Atualize a dependência e verifique suas chamadas `RBAC(config)(roles)`. A factory recebe primeiro a configuração opcional e depois o mapa de papéis.
3. Use `await rbac.can(role, operation, params?)`. A verificação sempre retorna `Promise<boolean>`.
4. Revise herança e condições `when`. Utilize `callbackWhen()` de `@rbac/rbac/helpers` para adaptar explicitamente callbacks legados do estilo Node.js.
5. Importe adapters de `@rbac/rbac/adapters` e integrações de frameworks de `@rbac/rbac/middlewares`; instale separadamente o driver de banco opcional correspondente.
6. Execute testes de regressão para acessos negados, papéis desconhecidos, isolamento entre tenants e condições antes de publicar.

Se a aplicação importava schemas diretamente da raiz do pacote, utilize `@rbac/rbac/schemas`. O factory CommonJS continua chamável por `require('@rbac/rbac')`, e a importação padrão ESM expõe a mesma API.

## Exemplo: adaptação explícita de uma condição com callback

```ts
import RBAC from '@rbac/rbac';
import { callbackWhen } from '@rbac/rbac/helpers';

const auth = RBAC<{ active: boolean }>()({
  member: { can: [{
    name: 'profile:edit',
    when: callbackWhen((context, done) => done(null, context.active))
  }] }
});

console.log(await auth.can('member', 'profile:edit', { active: true })); // true
```

Os adapters persistem definições de papéis, não closures arbitrárias executáveis. Revise condições serializadas ao migrar de papéis mantidos em memória. O [guia de atualização](./runtime.md) explica como modificar uma instância depois de carregar novas definições.
