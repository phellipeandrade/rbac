---
id: api
title: Referência de API
slug: /api
---

# Referência pública de API

Esta referência é **gerada automaticamente a partir do TypeScript com TypeDoc** durante cada build da documentação. Consulte-a para assinaturas, tipos e opções completas dos adapters. Os guias explicam os conceitos e apresentam exemplos executáveis.

| Caminho de importação | Exports |
| --- | --- |
| `@rbac/core` | `createRBAC`, `RBACOptions`, `RBACEngine`, tipos de roles e condições |
| `@rbac/core/helpers` | `callbackWhen` e outros helpers do núcleo |
| `@rbac/adapters` | `createTenantRBAC`, `RoleAdapter`, `MongoRoleAdapter`, `MySQLRoleAdapter`, `PostgresRoleAdapter` |
| `@rbac/express` | `createExpressMiddleware` e tipos relacionados |
| `@rbac/fastify` | `createFastifyMiddleware` e tipos relacionados |
| `@rbac/nestjs` | `createNestMiddleware`, `createNestGuard` e tipos relacionados |
| `@rbac/schemas` | `whenSchema`, `roleOperationSchema`, `roleSchema`, `rolesSchema` |

Explore as **entradas geradas** na barra lateral desta seção ou acesse a [referência TypeDoc](./reference/README.md).
