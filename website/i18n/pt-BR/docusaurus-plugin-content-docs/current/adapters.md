---
id: adapters
title: Adapters de banco e tenants
---

# Persista definições de roles

`RoleAdapter<P>` define `getRoles(tenantId?)`, `addRole(name, role, tenantId?)` e `updateRoles(roles, tenantId?)`. As implementações para MongoDB, MySQL e PostgreSQL estão em `@rbac/adapters`. Os drivers são opcionais e carregados conforme o adapter é criado ou estabelece conexão.

| Adapter | Instalar driver | Opções do construtor |
| --- | --- | --- |
| `MongoRoleAdapter` | `npm install mongodb` | `uri`, `dbName`, `collection`, `columns?` |
| `MySQLRoleAdapter` | `npm install mysql2` | `table`, `uri?` ou `config?`, `columns?` |
| `PostgresRoleAdapter` | `npm install pg` | `table`, opções do `Client` PostgreSQL (como `connectionString`), `columns?` |

## Carregue um tenant

```ts
import { createTenantRBAC } from '@rbac/adapters';
import { PostgresRoleAdapter } from '@rbac/adapters';

const adapter = new PostgresRoleAdapter({
  connectionString: process.env.DATABASE_URL,
  table: 'public.rbac_roles'
});

await adapter.updateRoles({ reader: { can: ['documents:read'] } }, 'acme');
const auth = await createTenantRBAC(adapter, 'acme');
console.log(await auth.can('reader', 'documents:read')); // true
```

`createTenantRBAC(adapter, tenantId, config?)` carrega as roles do tenant **uma vez** e cria uma instância RBAC independente em memória. Omitir `tenantId` nos métodos do adapter utiliza o tenant `default`. Informe o tenant de forma consistente em todas as operações de leitura e escrita. A aplicação deve autenticar e validar esse identificador.

Para recarregar todas as roles desse tenant, chame `auth.replaceRoles(await adapter.getRoles('acme'))`. Isso atualiza o motor em memória. Veja o efeito da exclusão de roles no [guia de atualizações em execução](./runtime.md#reload-the-complete-role-set).

## Mapeamento de tabelas e colunas

As estruturas de armazenamento devem existir previamente. Em SQL, os campos padrão são `name`, `role` (role serializada) e `tenant_id`; no MongoDB, `name`, `role` e `tenantId`. É possível alterá-los por `columns`:

```ts
import { MySQLRoleAdapter } from '@rbac/adapters';

const adapter = new MySQLRoleAdapter({
  table: 'rbac_roles',
  uri: process.env.MYSQL_URL,
  columns: { name: 'role_name', role: 'definition', tenantId: 'tenant_key' }
});
```

Identificadores SQL são validados e escapados conforme o dialeto; valores são enviados como parâmetros vinculados. Nomes de tabela podem conter schema nos dialetos compatíveis. `getRoles()` retorna definições de roles; `addRole()` insere um registro e `updateRoles()` persiste substituições conforme a estratégia do adapter. **Somente regras serializáveis** podem ser persistidas em SQL: `JSON.stringify` não conserva funções ou closures. Recrie os predicados `when` no código após o carregamento, ou mantenha-os no código. Também não é portátil armazenar funções executáveis no MongoDB.

Consulte opções e assinaturas na [referência gerada](./api/index.md).
