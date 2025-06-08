import rbac, { PostgresRoleAdapter } from '@rbac/rbac';

async function run(): Promise<void> {
  const adapter = new PostgresRoleAdapter({
    host: 'localhost',
    user: 'user',
    password: 'pass',
    database: 'rbac',
    table: 'roles'
  });

  const roles = await adapter.getRoles();
  const RBAC = rbac()(roles);

  await RBAC.can('user', 'products:find');
}

run().catch(console.error);
