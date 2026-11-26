---
id: runtime
title: Atualização de roles em execução
---

# Modifique uma instância em memória

`addRole(name, role)` adiciona ou substitui uma role. `updateRoles(roles)` mescla as definições por nome e mantém as roles omitidas. `replaceRoles(roles)` substitui o conjunto completo de roles na mesma instância. Os três métodos reconstroem as permissões herdadas e invalidam os caches.

```ts
import { createRBAC } from '@rbac/core';

const auth = createRBAC({ roles: { member: { can: ['notes:read'] } } });
console.log(await auth.can('member', 'notes:write')); // false

auth.updateRoles({ member: { can: ['notes:read', 'notes:write'] } });
console.log(await auth.can('member', 'notes:write')); // true

auth.addRole('auditor', { inherits: ['member'], can: ['logs:read'] });
console.log(await auth.can('auditor', 'notes:read')); // true
```

As atualizações são síncronas. Informe a lista `can` completa e o eventual `inherits` de cada role alterada.

## Recarregue todas as definições {#reload-the-complete-role-set}

Quando o banco retornar o conjunto completo de roles, passe-o para `replaceRoles()`. Roles omitidas perdem o acesso direto e deixam de conceder permissões por herança. Um conjunto vazio remove todas as roles.

```ts
import { createRBAC } from '@rbac/core';

const editor = { inherits: ['admin'], can: ['posts:edit'] };
const auth = createRBAC({ roles: { admin: { can: ['posts:delete'] }, editor } });
console.log(await auth.can('editor', 'posts:delete')); // true

auth.replaceRoles({ editor }); // admin foi excluída do banco
console.log(await auth.can('admin', 'posts:delete'));  // false
console.log(await auth.can('editor', 'posts:delete')); // false
console.log(await auth.can('editor', 'posts:edit'));   // true
```

As próximas chamadas a `can()` usam as novas roles. Verificações já iniciadas podem terminar usando as roles anteriores.

As instâncias **não** monitoram bancos nem sincronizam entre si. Veja como recarregar roles persistidas no [guia de adapters](./adapters.md). Atualize cada processo que atende o tenant. A associação entre usuários e roles é responsabilidade da aplicação.
