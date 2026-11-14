import { createRBAC } from '@rbac/core';
import { MongoRoleAdapter } from '@rbac/adapters';

async function run(): Promise<void> {
  const adapter = new MongoRoleAdapter({
    uri: 'mongodb://localhost:27017',
    dbName: 'rbac',
    collection: 'roles',
    columns: { name: 'rname', role: 'rdef', tenantId: 'tid' }
  });

  const roles = await adapter.getRoles();
  const RBAC = createRBAC({ roles });

  await RBAC.can('user', 'products:find');
}

run().catch(console.error);
