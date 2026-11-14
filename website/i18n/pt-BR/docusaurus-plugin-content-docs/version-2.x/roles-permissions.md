---
id: roles-permissions
title: Papéis e permissões (2.x)
---

# Papéis, herança e atualizações

Cada papel contém strings de permissão ou objetos condicionais `{ name, when }`. Um papel pode herdar permissões de outros por `inherits`.

```ts
import RBAC from '@rbac/rbac';

const auth = RBAC()({
  viewer: { can: ['files:read'] },
  editor: { inherits: ['viewer'], can: ['files:write'] }
});

console.log(await auth.can('editor', 'files:read')); // true

auth.addRole('admin', { inherits: ['editor'], can: ['files:delete'] });
console.log(await auth.can('admin', 'files:delete')); // true

auth.updateRoles({ viewer: { can: ['files:read', 'files:list'] } });
console.log(await auth.can('editor', 'files:list')); // true
```

Na 2.2.3, `updateRoles` mescla definições e `addRole` adiciona ou substitui um papel. `can(role, operation, params?)` retorna `Promise<boolean>`. Há suporte a padrões glob e expressões regulares; valide a semântica dos padrões no minor instalado antes de atualizar.

Veja também [condições](./conditions.md) e o [guia de migração](./migration.md).
