---
id: migration-2-to-3
title: Guia de migração — 2.x para 3.x
---

# Migrar do RBAC 2.x para o 3.x

Este guia compara a última versão da 2.x, **2.2.3**, com a linha **3.x**. Veja a [referência histórica 2.x](/rbac/pt-BR/docs/2.x/intro/) e o [guia de instalação 3.x](./installation.md).

## 1. Atualize o Node.js e instale

A versão 3 exige **Node.js 22.12.0 ou superior**. Verifique os ambientes de desenvolvimento, CI e produção antes de atualizar.

```bash
node --version
npm install @rbac/rbac@^3
```

A factory `RBAC(config)(roles)`, a herança e o retorno `Promise<boolean>` de `can()` permanecem disponíveis. Execute os testes de autorização com dados reais antes da implantação.

## 2. Utilize os exports oficiais

A versão 2.2.3 publicava somente a raiz no mapa `exports`. A versão 3 adiciona subcaminhos públicos:

| Recurso | 2.2.3 | 3.x |
| --- | --- | --- |
| Factory principal | `@rbac/rbac` | `@rbac/rbac` |
| Adapters de banco | Arquivos internos em `lib/adapters`; subcaminho não exportado | `@rbac/rbac/adapters` |
| Middlewares | Exportados pela raiz | `@rbac/rbac/middlewares` |
| Schemas | Reexportados pela raiz | `@rbac/rbac/schemas` ou `/roles.schema` |
| Helper de callback | Sem subcaminho exportado | `@rbac/rbac/helpers` |

```ts
import RBAC from '@rbac/rbac';
import { callbackWhen } from '@rbac/rbac/helpers';
import { createExpressMiddleware } from '@rbac/rbac/middlewares';
```

`require('@rbac/rbac')` continua sendo uma factory chamável em CommonJS. A 3.x oferece entradas ESM e CommonJS distintas que compartilham a instância do módulo. Atualize os imports e valide com o compilador e bundler da aplicação.

## 3. Revise os predicados condicionais

A 2.x aceitava callbacks `when(params, done)`. Na 3.x, **prefira encapsulá-los** com `callbackWhen()` do subcaminho `helpers`, em vez de depender da inferência do formato:

```ts
import RBAC from '@rbac/rbac';
import { callbackWhen } from '@rbac/rbac/helpers';

const auth = RBAC<{ active: boolean }>()({
  member: {
    can: [{
      name: 'profile:update',
      when: callbackWhen((params, done) => done(null, params.active))
    }]
  }
});

console.log(await auth.can('member', 'profile:update', { active: true })); // true
```

Na 3.x também são aceitos predicados síncronos/assíncronos, booleanos e promises. Condições com rejeições devem resultar em negação, e resultados condicionais não devem ser armazenados em cache independentemente dos parâmetros.

## 4. Atualize adapters e imports de schemas

Os drivers de banco são opcionais na 3.x. Instale somente `mongodb`, `mysql2` ou `pg` conforme necessário. Os adapters SQL validam e escapam identificadores de tabelas e colunas; nomes inválidos ou montados dinamicamente podem ser rejeitados. Revise as opções `columns` e nomes de tabelas com schema.

A importação da raiz não carrega Zod antecipadamente. Importe schemas de `@rbac/rbac/schemas` ou `@rbac/rbac/roles.schema`. Consulte [adapters](./adapters.md), [middlewares](./middlewares.md) e [segurança](./security-performance.md).

## 5. Valide a compatibilidade antes da implantação

Teste operações negadas, papéis desconhecidos, herança, glob/regex, `addRole()`/`updateRoles()`, condições assíncronas, falhas em middlewares e isolamento por tenant. Se utilizar TypeScript, compile consumidores ESM e CommonJS quando aplicável. Veja a [visão geral da migração](./migration.md).
