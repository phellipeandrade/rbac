---
id: installation
title: Instalação do RBAC 2.x
---

# Instalando a versão 2.x

Para manter uma aplicação nesta linha, utilize a última versão publicada:

```bash
npm install @rbac/rbac@2.2.3
```

O pacote 2.2.3 distribui declarações TypeScript em `lib/index.d.ts` e código CommonJS em `lib/index.js`. O mapa `exports` direciona tanto `import` quanto `require` para a mesma entrada JavaScript.

```ts
import RBAC from '@rbac/rbac';

const auth = RBAC()({
  visitor: { can: ['posts:view'] },
  member: { inherits: ['visitor'], can: ['posts:create'] }
});

console.log(await auth.can('member', 'posts:view')); // true
```

A versão 2.2.3 aceita as opções `logger`, `enableLogger` e `colors`. A entrada raiz também disponibiliza `createTenantRBAC`, middlewares e schemas. O mapa de exports da 2.x expõe **somente a raiz do pacote**: os subcaminhos `@rbac/rbac/adapters` e equivalentes são contratos publicados a partir da 3.x.

Veja [migração](./migration.md) para os requisitos atuais do Node.js.
