---
id: api
title: Referência da API do RBAC 1.x
---

# Referência da API — 1.1.0

Esta é uma **referência histórica** baseada no pacote e README publicados na versão 1.1.0, separada do TypeDoc gerado para a 3.x.

| API | Descrição |
| --- | --- |
| `require('@rbac/rbac')` | Carrega a factory JavaScript. |
| `RBAC(config?)(roles)` | Cria uma instância de autorização. |
| `roles[role].can` | Permissões em string ou entradas condicionais `{ name, when }`. |
| `roles[role].inherits` | Array opcional de papéis herdados. |
| `auth.can(role, operation, params?)` | Verifica a autorização de maneira assíncrona. |
| `config.enableLogger` | Habilita ou desabilita logs. |
| `config.logger` | Customiza a função de logging. |

```js
const RBAC = require('@rbac/rbac');
const auth = RBAC({ enableLogger: false })({
  viewer: { can: ['reports:read'] }
});

auth.can('viewer', 'reports:read').then(console.log); // true
```

Declarações TypeScript, `addRole`, `updateRoles`, adapters de banco e middlewares **não integram a API publicada da 1.x**. Consulte o [guia de migração 1.x → 2.x](/rbac/pt-BR/docs/migration-1-to-2/).
