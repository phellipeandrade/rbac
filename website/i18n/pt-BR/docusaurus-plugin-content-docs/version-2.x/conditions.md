---
id: conditions
title: Condições de permissão (2.x)
---

# Predicados `when` na 2.2.3

O tipo TypeScript `When<P>` publicado aceita booleanos, promises, predicados síncronos ou assíncronos e callbacks legados no padrão Node.js.

```ts
import RBAC from '@rbac/rbac';

interface Context { active: boolean; ownerId: number; userId: number }

const auth = RBAC<Context>()({
  editor: {
    can: [{
      name: 'posts:update',
      when: async ({ active, ownerId, userId }) => active && ownerId === userId
    }]
  }
});

console.log(await auth.can('editor', 'posts:update', {
  active: true, ownerId: 12, userId: 12
})); // true
```

O callback `when: (params, done) => done(null, boolean)` também faz parte das declarações da 2.2.3. Na 3.x, o recomendado é usar `callbackWhen()` para marcar explicitamente esse formato.

Não copie o import `@rbac/rbac/helpers` para um projeto 2.x: ele não era um subcaminho exportado no pacote 2.2.3. Veja o [guia de migração](./migration.md).
