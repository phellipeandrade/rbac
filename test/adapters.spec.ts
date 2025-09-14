// Mock modules using Jest's automatic mocking
jest.mock('mongodb');
jest.mock('mysql2/promise');
jest.mock('pg');

// Import the mocked modules to get access to the global variables
const mysql2 = require('mysql2/promise');
const pg = require('pg');

// --- Tests ---
describe('Role Adapters', () => {

  describe('MongoRoleAdapter', () => {
    it('should add and retrieve roles', async () => {
      const { MongoRoleAdapter } = require('../src/adapters/mongodb');
      const adapter = new MongoRoleAdapter({ uri: '', dbName: 'db', collection: 'roles' });
      await adapter.addRole('user', { can: ['a'] });
      let roles = await adapter.getRoles();
      expect(roles).toHaveProperty('user');
      expect(roles.user.can).toEqual(['a']);

      await adapter.updateRoles({ user: { can: ['b'] }, admin: { can: ['c'] } });
      roles = await adapter.getRoles();
      expect(roles.user.can).toEqual(['b']);
      expect(roles.admin.can).toEqual(['c']);
    });

    it('should work with custom columns', async () => {
      const { MongoRoleAdapter } = require('../src/adapters/mongodb');
      const adapter = new MongoRoleAdapter({
        uri: '',
        dbName: 'db',
        collection: 'roles',
        columns: { name: 'rname', role: 'rdef', tenantId: 'tid' }
      });
      await adapter.addRole('user', { can: ['a'] }, 't1');
      const roles = await adapter.getRoles('t1');
      expect(roles.user.can).toEqual(['a']);
    });

    it('should update roles with custom columns', async () => {
      const { MongoRoleAdapter } = require('../src/adapters/mongodb');
      const adapter = new MongoRoleAdapter({
        uri: '',
        dbName: 'db',
        collection: 'roles',
        columns: { name: 'rname', role: 'rdef', tenantId: 'tid' }
      });
      await adapter.updateRoles({ user: { can: ['b'] } }, 't2');
      const roles = await adapter.getRoles('t2');
      expect(roles.user.can).toEqual(['b']);
    });

    it('should respect the collection option', async () => {
      const { MongoRoleAdapter } = require('../src/adapters/mongodb');
      const a = new MongoRoleAdapter({ uri: '', dbName: 'db', collection: 'c1' });
      const b = new MongoRoleAdapter({ uri: '', dbName: 'db', collection: 'c2' });

      await a.addRole('user', { can: ['a'] });
      await b.addRole('user', { can: ['b'] });

      const rolesA = await a.getRoles();
      const rolesB = await b.getRoles();

      expect(rolesA.user.can).toEqual(['a']);
      expect(rolesB.user.can).toEqual(['b']);
    });
  });

  describe('MySQLRoleAdapter', () => {
    it('should add and retrieve roles', async () => {
      const { MySQLRoleAdapter } = require('../src/adapters/mysql');
      const adapter = new MySQLRoleAdapter({ table: 'roles' });
      await adapter.addRole('user', { can: ['a'] });
      let roles = await adapter.getRoles();
      expect(roles.user.can).toEqual(['a']);

      await adapter.updateRoles({ user: { can: ['b'] }, admin: { can: ['c'] } });
      roles = await adapter.getRoles();
      expect(roles.user.can).toEqual(['b']);
      expect(roles.admin.can).toEqual(['c']);
    });

    it('should work with custom columns', async () => {
      const { MySQLRoleAdapter } = require('../src/adapters/mysql');
      const adapter = new MySQLRoleAdapter({
        table: 'roles',
        columns: { name: 'rname', role: 'rdef', tenantId: 'tid' }
      });
      await adapter.addRole('user', { can: ['a'] });
      const roles = await adapter.getRoles();
      expect(roles.user.can).toEqual(['a']);
    });

    it('should update roles with custom columns', async () => {
      const { MySQLRoleAdapter } = require('../src/adapters/mysql');
      const adapter = new MySQLRoleAdapter({
        table: 'roles',
        columns: { name: 'rname', role: 'rdef', tenantId: 'tid' }
      });
      await adapter.updateRoles({ user: { can: ['c'] } });
      const roles = await adapter.getRoles();
      expect(roles.user.can).toEqual(['c']);
    });

    it('should respect the table option', async () => {
      const { MySQLRoleAdapter } = require('../src/adapters/mysql');
      const adapter = new MySQLRoleAdapter({ table: 'custom_roles' });
      await adapter.addRole('user', { can: ['a'] });
      // Wait for the mock to be set up
      await new Promise(resolve => setTimeout(resolve, 10));
      expect((global as any).lastMySQLConnection?.tables).toHaveProperty('custom_roles');
      const roles = await adapter.getRoles();
      expect(roles.user.can).toEqual(['a']);
    });
  });

  describe('PostgresRoleAdapter', () => {
    it('should add and retrieve roles', async () => {
      const { PostgresRoleAdapter } = require('../src/adapters/postgres');
      const adapter = new PostgresRoleAdapter({ table: 'roles' });
      await adapter.addRole('user', { can: ['a'] });
      let roles = await adapter.getRoles();
      expect(roles.user.can).toEqual(['a']);

      await adapter.updateRoles({ user: { can: ['b'] }, admin: { can: ['c'] } });
      roles = await adapter.getRoles();
      expect(roles.user.can).toEqual(['b']);
      expect(roles.admin.can).toEqual(['c']);
    });

    it('should work with custom columns', async () => {
      const { PostgresRoleAdapter } = require('../src/adapters/postgres');
      const adapter = new PostgresRoleAdapter({
        table: 'roles',
        columns: { name: 'rname', role: 'rdef', tenantId: 'tid' }
      });
      await adapter.addRole('user', { can: ['a'] });
      const roles = await adapter.getRoles();
      expect(roles.user.can).toEqual(['a']);
    });

    it('should update roles with custom columns', async () => {
      const { PostgresRoleAdapter } = require('../src/adapters/postgres');
      const adapter = new PostgresRoleAdapter({
        table: 'roles',
        columns: { name: 'rname', role: 'rdef', tenantId: 'tid' }
      });
      await adapter.updateRoles({ user: { can: ['c'] } });
      const roles = await adapter.getRoles();
      expect(roles.user.can).toEqual(['c']);
    });

    it('should respect the table option', async () => {
      const { PostgresRoleAdapter } = require('../src/adapters/postgres');
      const adapter = new PostgresRoleAdapter({ table: 'custom_roles' });
      await adapter.addRole('user', { can: ['a'] });
      // Wait for the mock to be set up
      await new Promise(resolve => setTimeout(resolve, 10));
      expect((global as any).lastPGClient?.tables).toHaveProperty('custom_roles');
      const roles = await adapter.getRoles();
      expect(roles.user.can).toEqual(['a']);
    });
  });

  describe('multi-tenant behavior', () => {
    it('should isolate roles per tenant', async () => {
      const { MongoRoleAdapter } = require('../src/adapters/mongodb');
      const { createTenantRBAC } = require('../src/index');
      const adapter = new MongoRoleAdapter({ uri: '', dbName: 'db', collection: 'roles' });

      await adapter.addRole('user', { can: ['a'] }, 'tenant-a');
      await adapter.addRole('user', { can: ['b'] }, 'tenant-b');

      const rbacA = await createTenantRBAC(adapter, 'tenant-a', { enableLogger: false });
      const rbacB = await createTenantRBAC(adapter, 'tenant-b', { enableLogger: false });

      const aFind = await rbacA.can('user', 'a');
      const bFind = await rbacB.can('user', 'b');
      const aWrong = await rbacA.can('user', 'b');

      expect(aFind).toBe(true);
      expect(bFind).toBe(true);
      expect(aWrong).toBe(false);
    });
  });
});
