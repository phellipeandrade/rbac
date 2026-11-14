---
id: intro
title: Introdução
sidebar_position: 1
---

# Autorização previsível

`@rbac/rbac` é uma biblioteca TypeScript de **controle de acesso baseado em papéis (RBAC)** para Node.js. Defina operações permitidas para cada role, herde permissões de outras roles e consulte se uma operação está autorizada.

A biblioteca implementa **autorização**, não autenticação: sua aplicação identifica o usuário, determina a role confiável e fornece o contexto. O RBAC retorna uma decisão, e sua aplicação precisa aplicá-la.

## Uma decisão completa

```ts showLineNumbers highlight={8-10}
import RBAC from '@rbac/rbac';

const rbac = RBAC()({
  viewer: { can: ['documents:read'] },
  editor: { inherits: ['viewer'], can: ['documents:edit'] }
});

console.log(await rbac.can('editor', 'documents:read')); // true
console.log(await rbac.can('viewer', 'documents:edit')); // false
console.log(await rbac.can('unknown', 'documents:read')); // false
```

`RBAC(config)(roles)` retorna uma instância com `can()`, `addRole()` e `updateRoles()`. Mesmo para permissões incondicionais, as verificações retornam uma promise. Roles desconhecidas e permissões ausentes são negadas por padrão.

## Recursos disponíveis

| Recurso | Guia |
| --- | --- |
| Permissões exatas, herança e condições repetidas | [Roles e permissões](./roles-permissions.md) |
| Wildcards e expressões regulares | [Padrões](./patterns.md) |
| Condições por requisição e predicados assíncronos | [Condições](./conditions.md) |
| Gestão de roles em execução | [Atualização de roles](./runtime.md) |
| Persistência por tenant | [Adapters de banco](./adapters.md) |
| Express, NestJS e Fastify | [Middlewares](./middlewares.md) |

Continue com a [instalação](./installation.md) ou abra o [playground interativo](/playground).
