---
id: conditions
title: Condições de permissão (1.x)
---

# Condições `when`

A versão 1.1.0 documenta callbacks no padrão Node.js e promises como condições. O callback recebe o contexto e a função `done(erro, permitido)`:

```js
const RBAC = require('@rbac/rbac');

const auth = RBAC()({
  author: {
    can: [{
      name: 'posts:edit',
      when: (context, done) => done(null, context.authorId === context.userId)
    }]
  }
});

auth.can('author', 'posts:edit', { authorId: 7, userId: 7 })
  .then(console.log); // true
```

O contrato histórico também aceita uma promise diretamente em `when`. Quando a decisão depender do estado atual, prefira um predicado avaliado por requisição. Não presuma que todas as formas modernas de predicados ou o helper `callbackWhen()` já existam na 1.x.

Verifique a origem dos parâmetros no backend antes de utilizá-los nas decisões de autorização. Consulte a [migração](./migration.md) para o comportamento atual.
