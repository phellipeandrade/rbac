import { createRBAC } from '@rbac/core';
import { MongoRoleAdapter, createTenantRBAC } from '@rbac/adapters';

async function run(): Promise<void> {
  const adapter = new MongoRoleAdapter({
    uri: 'mongodb://localhost:27017',
    dbName: 'rbac',
    collection: 'roles'
  });

  // roles are stored per tenant when tenantId is provided
  await adapter.addRole('user', { can: ['products:find'] }, 'tenant-a');
  await adapter.addRole('user', { can: ['products:edit'] }, 'tenant-b');

  // retrieving RBAC instance scoped to a tenant
  const rbacTenantA = await createTenantRBAC(adapter, 'tenant-a');

  await rbacTenantA.can('user', 'products:find'); // true
  await rbacTenantA.can('user', 'products:edit'); // false

  // default tenant still works without specifying tenantId
  await adapter.addRole('guest', { can: ['products:view'] });
  const roles = await adapter.getRoles();
  const defaultRBAC = createRBAC({ roles });
  await defaultRBAC.can('guest', 'products:view'); // true
}

run().catch(console.error);

