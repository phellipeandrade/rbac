---
id: intro
title: Visão geral do RBAC 1.x
---

# RBAC 1.x

Esta é a **documentação histórica da linha 1.x**, baseada na última versão publicada no npm, **1.1.0**. Abrange as versões 1.0.0–1.1.0; funcionalidades introduzidas na 1.1.0, como padrões glob, podem não existir nas versões 1.0.x.

**Descontinuada:** a linha 1.x não recebe manutenção. Novos projetos devem utilizar a [3.x (latest)](/rbac/pt-BR/docs/intro/). Para migrar, consulte os guias [1.x → 2.x](/rbac/pt-BR/docs/migration-1-to-2/) e [2.x → 3.x](/rbac/pt-BR/docs/migration-2-to-3/).

A versão 1.x oferece um mecanismo JavaScript de autorização por papéis, com herança de permissões, padrões e condições. A factory usa `RBAC(config)(roles)`.

```js
const RBAC = require('@rbac/rbac');

const auth = RBAC({ enableLogger: false })({
  reader: { can: ['articles:read'] },
  editor: { inherits: ['reader'], can: ['articles:write'] }
});

auth.can('editor', 'articles:read').then(console.log); // true
auth.can('reader', 'articles:write').then(console.log); // false
```

O pacote 1.x distribuía um bundle JavaScript, **sem declarações TypeScript**. Ele não incluía atualizações de papéis em execução nem as APIs de adapters e tenants introduzidas na 2.x.

Comece pela [instalação](./installation.md), consulte [papéis e permissões](./roles-permissions.md), [condições](./conditions.md) e a [referência histórica da API](./api.md).
