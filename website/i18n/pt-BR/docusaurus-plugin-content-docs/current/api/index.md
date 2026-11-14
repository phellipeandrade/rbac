---
id: api
title: Referência de API
slug: /api
---

# Referência pública de API

Esta referência é **gerada automaticamente a partir do TypeScript com TypeDoc** durante cada build da documentação. Consulte-a para assinaturas, tipos e opções completas dos adapters. Os guias explicam os conceitos e apresentam exemplos executáveis.

| Caminho de importação | Exports |
| --- | --- |
| `@rbac/rbac` | Factory padrão `RBAC`, `createTenantRBAC`, exports de adapters e middlewares, tipos públicos |
| `@rbac/rbac/adapters` | `RoleAdapter`, `MongoRoleAdapter`, `MySQLRoleAdapter`, `PostgresRoleAdapter` |
| `@rbac/rbac/middlewares` | `createExpressMiddleware`, `createNestMiddleware`, `createNestGuard`, `createFastifyMiddleware` |
| `@rbac/rbac/helpers` | `callbackWhen`, utilitários de padrões, logging e normalização |
| `@rbac/rbac/schemas` ou `/roles.schema` | `whenSchema`, `roleOperationSchema`, `roleSchema`, `rolesSchema` |

Explore as **entradas geradas** na barra lateral desta seção ou acesse a [referência TypeDoc](./reference/README.md).
