---
id: roles-permissions
title: Roles, permissões e herança
---

# Defina as permissões

Toda role exige um array `can`. As entradas podem ser strings de operações ou objetos `{name, when}`. `inherits` é um array opcional de nomes de roles herdadas. Um `can` vazio é válido.

```ts
import { createRBAC } from '@rbac/core';

const rbac = createRBAC({ roles: {
  guest: { can: ['articles:read'] },
  writer: { inherits: ['guest'], can: ['articles:create', 'articles:edit'] },
  admin: { inherits: ['writer'], can: ['articles:delete'] },
  restricted: { can: [] }
} });

console.log(await rbac.can('admin', 'articles:read')); // true
console.log(await rbac.can('writer', 'articles:delete')); // false
console.log(await rbac.can('restricted', 'articles:read')); // false
```

A herança é **aditiva**: a role filha mantém suas permissões e recebe as permissões das roles herdadas, inclusive indiretamente. Condições herdadas continuam sendo aplicadas. Não existem regras explícitas de negação nem um cadastro de associação entre usuários e roles.

## Regras que autorizam a mesma operação

Permissões repetidas não substituem umas às outras. O motor avalia condições independentes e autoriza quando pelo menos uma retorna `true`:

```ts
import { createRBAC } from '@rbac/core';

type Context = { owns: boolean; isTeamLead: boolean };
const auth = createRBAC<Context>({ roles: {
  editor: { can: [
    { name: 'post:update', when: ({ owns }: Context) => owns },
    { name: 'post:update', when: ({ isTeamLead }: Context) => isTeamLead }
  ] }
} });

console.log(await auth.can('editor', 'post:update', { owns: false, isTeamLead: true })); // true
```

Use os tipos TypeScript `Roles<P>` e `Role<P>` para tipar definições. Para correspondência entre operações, consulte [padrões](./patterns.md).
