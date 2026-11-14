---
id: migration-1-to-2
title: Guia de migração — 1.x para 2.x
---

# Migrar do RBAC 1.x para o 2.x

As últimas versões de cada linha são **1.1.0** e **2.2.3**. Ambas foram descontinuadas; para uma aplicação ativa, continue para o [guia 2.x → 3.x](./migration-2-to-3.md) após esta etapa. Compare a [documentação 1.x](/rbac/pt-BR/docs/1.x/intro/) com a [2.x](/rbac/pt-BR/docs/2.x/intro/).

## 1. Registre o comportamento da versão existente

```bash
npm install @rbac/rbac@1.1.0 --save-exact
```

Registre decisões de `can()` para papéis desconhecidos, herança, wildcards e condições com callback. Verifique o minor instalado: os padrões glob aparecem na documentação 1.1.0 e podem não existir nas versões 1.0.x.

## 2. Atualize para a última versão da 2.x

```bash
npm install @rbac/rbac@2.2.3 --save-exact
```

A 1.x distribuía um bundle JavaScript sem declarações TypeScript. A 2.x passou a utilizar TypeScript, distribuir `.d.ts` e publicar um mapa de exports com uma entrada CommonJS para `import` e `require`. A factory curried e as verificações assíncronas continuam disponíveis:

```ts
import RBAC from '@rbac/rbac';

const auth = RBAC<{ verified: boolean }>()({
  member: { can: [{ name: 'posts:publish', when: ({ verified }: { verified: boolean }) => verified }] }
});

console.log(await auth.can('member', 'posts:publish', { verified: true }));
```

Se o projeto ainda utiliza JavaScript/CommonJS, pode manter `require('@rbac/rbac')` e `RBAC(config)(roles)`; a migração para TypeScript é opcional.

## 3. Revise APIs novas e premissas antigas

A 2.2.3 introduz `addRole()`, `updateRoles()`, `createTenantRBAC()`, middlewares de frameworks, implementações de adapters e schemas. Confira a [API histórica da 2.x](/rbac/pt-BR/docs/2.x/api/) para identificar os exports. **O mapa `exports` da 2.2.3 contém apenas `"."`**: imports profundos como `@rbac/rbac/lib/adapters` não são caminhos públicos confiáveis. Os subcaminhos oficiais da 3.x ainda não existiam.

Ambas as linhas documentam callbacks e promises em condições, mas a implementação e os formatos suportados evoluíram. Teste cada condição com entradas permitidas e negadas. Aguarde sempre o resultado de `can()` e valide o contexto de recursos no backend.

## 4. Continue para a linha mantida

Instale a versão mantida e siga o [guia 2.x → 3.x](./migration-2-to-3.md) para adequar Node.js, exports, dependências opcionais, schemas e callbacks condicionais.

```bash
npm install @rbac/rbac@^3
```

Execute testes de regressão antes de implantar, cobrindo negações, alterações de hierarquia, condições repetidas e isolamento entre tenants.
