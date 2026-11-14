---
id: roles-permissions
title: Papéis e permissões (1.x)
---

# Papéis, permissões e herança

Passe um mapa de papéis na segunda chamada da factory. Cada papel possui um array `can` e pode herdar permissões por `inherits`.

```js
const RBAC = require('@rbac/rbac');

const auth = RBAC()({
  guest: { can: ['posts:view'] },
  member: { inherits: ['guest'], can: ['posts:comment'] },
  moderator: { inherits: ['member'], can: ['posts:*'] }
});

auth.can('member', 'posts:view').then(console.log); // true
auth.can('guest', 'posts:comment').then(console.log); // false
```

O wildcard `*` está documentado na **1.1.0**. Versões 1.0.x podem apresentar diferenças; valide os padrões utilizados ao atualizar. O README histórico também descreve operações com expressões regulares. As permissões podem ser strings ou objetos `{ name, when }`.

Sempre aguarde a decisão assíncrona. O papel deve ser obtido de um contexto autenticado e confiável. Veja também [condições](./conditions.md).
