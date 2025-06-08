import rbac, { MySQLRoleAdapter } from '@rbac/rbac';

async function run(): Promise<void> {
  const adapter = new MySQLRoleAdapter({
    uri: 'mysql://user:pass@localhost/rbac',
    table: 'roles'
  });

  const roles = await adapter.getRoles();
  const RBAC = rbac()(roles);

  await RBAC.can('user', 'products:find');
}

run().catch(console.error);
