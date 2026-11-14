import { createRBAC } from '@rbac/core';
import { PostgresRoleAdapter } from '@rbac/adapters';

async function run(): Promise<void> {
  const adapter = new PostgresRoleAdapter({
    host: 'localhost',
    user: 'user',
    password: 'pass',
    database: 'rbac',
    table: 'roles',
    columns: { name: 'rname', role: 'rdef', tenantId: 'tid' }
  });

  const roles = await adapter.getRoles();
  const RBAC = createRBAC({ roles });

  await RBAC.can('user', 'products:find');
}

run().catch(console.error);
