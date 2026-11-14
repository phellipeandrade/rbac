---
id: examples
title: Exemplos práticos
---

# Comece com regras simples

Os exemplos usam a API pública real e podem ser adaptados à aplicação. Instale `@rbac/core` antes de executá-los.

## Hierarquia de roles

```ts
import { createRBAC } from '@rbac/core';

const auth = createRBAC({ roles: {
  guest: { can: ['catalog:view'] },
  seller: { inherits: ['guest'], can: ['catalog:create'] },
  manager: { inherits: ['seller'], can: ['catalog:remove'] }
} });

console.log(await auth.can('manager', 'catalog:view')); // true
console.log(await auth.can('seller', 'catalog:remove')); // false
```

## Condição assíncrona de propriedade

```ts
import { createRBAC } from '@rbac/core';

type Context = { actorId: string; documentId: string };
async function belongsTo(actorId: string, documentId: string): Promise<boolean> {
  // Substitua por uma consulta confiável ao banco de dados.
  return actorId === 'user-1' && documentId === 'doc-1';
}

const auth = createRBAC<Context>({ roles: {
  writer: { can: [{
    name: 'document:edit',
    when: ({ actorId, documentId }: Context) => belongsTo(actorId, documentId)
  }] }
} });

console.log(await auth.can('writer', 'document:edit', {
  actorId: 'user-1', documentId: 'doc-1'
})); // true
```

## Validar configurações

```ts
import { rolesSchema } from '@rbac/schemas';

const validated = rolesSchema.parse({
  guest: { can: ['catalog:view'] }
});
console.log(validated.guest.can); // ['catalog:view']
```

Os schemas ficam em um subpath Zod opcional; isso não significa que funções serializadas arbitrárias sejam permissões executáveis. Consulte [condições](./conditions.md), [adapters](./adapters.md) e o [playground](/playground).
