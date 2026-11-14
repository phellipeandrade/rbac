---
id: conditions
title: Condições e permissões assíncronas
---

# Restrinja permissões com `when`

Uma permissão condicional usa `{name: string, when: When<P>}`. O `when` aceita booleanos, `Promise<boolean>`, predicados síncronos ou assíncronos e funções com callback no estilo Node. Prefira predicados síncronos para verificações simples e assíncronos quando precisar consultar dados.

```ts
import RBAC from '@rbac/rbac';

interface Context { userId: string; ownerId: string; suspended: boolean }

const auth = RBAC<Context>()({
  member: { can: [{
    name: 'records:update',
    when: async ({ userId, ownerId, suspended }: Context) => !suspended && userId === ownerId
  }] }
});

console.log(await auth.can('member', 'records:update', {
  userId: '42', ownerId: '42', suspended: false
})); // true
```

## Adaptação de callbacks legados

O helper `callbackWhen` adapta explicitamente a forma com callback:

```ts
import RBAC from '@rbac/rbac';
import { callbackWhen } from '@rbac/rbac/helpers';

const auth = RBAC<{ verified: boolean }>()({
  member: { can: [{
    name: 'profile:update',
    when: callbackWhen((context, done) => done(null, context.verified))
  }] }
});

console.log(await auth.can('member', 'profile:update', { verified: true })); // true
```

Exceções síncronas, promises rejeitadas e erros de callback negam a permissão (`false`). **O motor não verifica se `params` são confiáveis**: obtenha ou valide os dados de posse e tenant no servidor e não considere um `ownerId` enviado pelo cliente como prova de propriedade.

Resultados condicionais não são armazenados em cache. Uma nova chamada com outros parâmetros reavalia a condição. Já uma `Promise<boolean>` passada diretamente ao `when` é uma mesma promise reutilizada nas chamadas; prefira uma função se o resultado precisar refletir o estado atual.
