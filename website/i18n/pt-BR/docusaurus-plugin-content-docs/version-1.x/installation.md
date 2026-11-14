---
id: installation
title: Instalação do RBAC 1.x
---

# Instalando a versão 1.x

Para manter uma integração legada, fixe a versão final desta linha:

```bash
npm install @rbac/rbac@1.1.0
```

O pacote 1.1.0 disponibiliza um bundle JavaScript pela entrada `main`. Utilize CommonJS conforme o pacote publicado:

```js
const RBAC = require('@rbac/rbac');

const auth = RBAC()({
  visitor: { can: ['posts:read'] },
  author: { inherits: ['visitor'], can: ['posts:create'] }
});

auth.can('author', 'posts:read').then(console.log); // true
```

A configuração opcional inclui `enableLogger` e `logger`, conforme o README da versão. Não há arquivo de declarações TypeScript publicado nessa linha.

Este conteúdo preserva a API antiga; ele não garante suporte do pacote 1.x às versões modernas do Node.js. Consulte o [guia de migração](./migration.md).
