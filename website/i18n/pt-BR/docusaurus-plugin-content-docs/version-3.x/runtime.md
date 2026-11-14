---
id: runtime
title: Atualização de roles em execução
---

# Modifique uma instância em memória

`addRole(name, role)` adiciona ou substitui uma role. `updateRoles(roles)` mescla as definições por nome, substituindo toda a definição de cada role informada, reconstruindo as permissões herdadas e invalidando os caches.

```ts
import RBAC from '@rbac/rbac';

const auth = RBAC()({ member: { can: ['notes:read'] } });
console.log(await auth.can('member', 'notes:write')); // false

auth.updateRoles({ member: { can: ['notes:read', 'notes:write'] } });
console.log(await auth.can('member', 'notes:write')); // true

auth.addRole('auditor', { inherits: ['member'], can: ['logs:read'] });
console.log(await auth.can('auditor', 'notes:read')); // true
```

As atualizações são síncronas. Ao substituir uma role, informe a lista `can` completa e o eventual `inherits`; campos omitidos não são preservados para essa role. Roles ausentes da chamada `updateRoles()` permanecem disponíveis.

As instâncias **não** monitoram bancos ou sincronizam entre si. A persistência é feita explicitamente nos adapters; veja [adapters](./adapters.md). Em aplicações com múltiplos processos, distribua as mudanças e atualize cada instância.
