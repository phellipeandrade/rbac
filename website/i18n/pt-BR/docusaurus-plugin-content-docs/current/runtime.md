---
id: runtime
title: Atualização de roles em execução
---

# Modifique uma instância em memória

`addRole(name, role)` adiciona ou substitui uma role. `updateRoles(roles)` mescla as definições por nome, substituindo toda a definição de cada role informada, reconstruindo as permissões herdadas e invalidando os caches.

```ts
import { createRBAC } from '@rbac/core';

const auth = createRBAC({ roles: { member: { can: ['notes:read'] } } });
console.log(await auth.can('member', 'notes:write')); // false

auth.updateRoles({ member: { can: ['notes:read', 'notes:write'] } });
console.log(await auth.can('member', 'notes:write')); // true

auth.addRole('auditor', { inherits: ['member'], can: ['logs:read'] });
console.log(await auth.can('auditor', 'notes:read')); // true
```

As atualizações são síncronas. Ao substituir uma role, informe a lista `can` completa e o eventual `inherits`; campos omitidos não são preservados para essa role. Roles ausentes da chamada `updateRoles()` permanecem disponíveis.

As instâncias **não** monitoram bancos nem sincronizam entre si.

## Recarregue todas as definições {#reload-the-complete-role-set}

Após excluir a definição de uma role do banco, crie uma nova instância com todas as roles que restaram. Chamar `updateRoles()` com essa lista mantém a role excluída na instância existente, onde ela ainda pode conceder permissões diretamente e por herança.

```ts
import { createRBAC } from '@rbac/core';

const editor = { inherits: ['admin'], can: ['posts:edit'] };
let auth = createRBAC({ roles: { admin: { can: ['posts:delete'] }, editor } });
console.log(await auth.can('editor', 'posts:delete')); // true

// Conjunto completo de roles retornado pelo banco após a exclusão de admin.
auth = createRBAC({ roles: { editor } });
console.log(await auth.can('admin', 'posts:delete')); // false
console.log(await auth.can('editor', 'posts:delete')); // false
console.log(await auth.can('editor', 'posts:edit'));   // true
```

Use as mesmas opções ao substituir a instância. Se você carrega as roles com um [adapter](./adapters.md), chame `createTenantRBAC()` novamente para o mesmo tenant e use a instância retornada nas verificações seguintes. Cada processo que atende o tenant precisa atualizar a própria instância. A remoção da associação entre um usuário e uma role é feita separadamente e tem efeito quando a aplicação passa a consultar a associação atualizada.
