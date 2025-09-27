/* global describe, it, before, after */
import { afterAll, afterEach, beforeAll, describe, expect, it, jest } from '@jest/globals';
import Module from 'module';

// ... existing code ...

  describe('MongoRoleAdapter', () => {
    it('should add and retrieve roles', async () => {
      const { MongoRoleAdapter } = require('../src/adapters/mongodb');
      const adapter = new MongoRoleAdapter({ uri: '', dbName: 'db', collection: 'roles' });
      await adapter.addRole('user', { can: ['a'] });
      let roles = await adapter.getRoles();
      expect(roles).to.have.property('user');
      expect(roles.user.can).to.deep.equal(['a']);

      await adapter.updateRoles({ user: { can: ['b'] }, admin: { can: ['c'] } });
      roles = await adapter.getRoles();
      expect(roles.user.can).to.deep.equal(['b']);
      expect(roles.admin.can).to.deep.equal(['c']);
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
      expect(roles.user.can).to.deep.equal(['a']);
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
      expect(roles.user.can).to.deep.equal(['b']);
    });

    it('should respect the collection option', async () => {
      const { MongoRoleAdapter } = require('../src/adapters/mongodb');
      const a = new MongoRoleAdapter({ uri: '', dbName: 'db', collection: 'c1' });
      const b = new MongoRoleAdapter({ uri: '', dbName: 'db', collection: 'c2' });

      await a.addRole('user', { can: ['a'] });
      await b.addRole('user', { can: ['b'] });

      const rolesA = await a.getRoles();
      const rolesB = await b.getRoles();

      expect(rolesA.user.can).to.deep.equal(['a']);
      expect(rolesB.user.can).to.deep.equal(['b']);
    });
  });

  describe('MySQLRoleAdapter', () => {
    it('should add and retrieve roles', async () => {
      const { MySQLRoleAdapter } = require('../src/adapters/mysql');
      const adapter = new MySQLRoleAdapter({ table: 'roles' });
      await adapter.addRole('user', { can: ['a'] });
      let roles = await adapter.getRoles();
      expect(roles.user.can).to.deep.equal(['a']);

      await adapter.updateRoles({ user: { can: ['b'] }, admin: { can: ['c'] } });
      roles = await adapter.getRoles();
      expect(roles.user.can).to.deep.equal(['b']);
      expect(roles.admin.can).to.deep.equal(['c']);
    });

    it('should work with custom columns', async () => {
      const { MySQLRoleAdapter } = require('../src/adapters/mysql');
      const adapter = new MySQLRoleAdapter({
        table: 'roles',
        columns: { name: 'rname', role: 'rdef', tenantId: 'tid' }
      });
      await adapter.addRole('user', { can: ['a'] });
      const roles = await adapter.getRoles();
      expect(roles.user.can).to.deep.equal(['a']);
    });

    it('should update roles with custom columns', async () => {
      const { MySQLRoleAdapter } = require('../src/adapters/mysql');
      const adapter = new MySQLRoleAdapter({
        table: 'roles',
        columns: { name: 'rname', role: 'rdef', tenantId: 'tid' }
      });
      await adapter.updateRoles({ user: { can: ['c'] } });
      const roles = await adapter.getRoles();
      expect(roles.user.can).to.deep.equal(['c']);
    });

    it('should respect the table option', async () => {
      const { MySQLRoleAdapter } = require('../src/adapters/mysql');
      const adapter = new MySQLRoleAdapter({ table: 'custom_roles' });
      await adapter.addRole('user', { can: ['a'] });
      expect(lastMySQLConnection.tables).to.have.property('custom_roles');
      const roles = await adapter.getRoles();
      expect(roles.user.can).to.deep.equal(['a']);
    });
  });

  describe('PostgresRoleAdapter', () => {
    it('should add and retrieve roles', async () => {
      const { PostgresRoleAdapter } = require('../src/adapters/postgres');
      const adapter = new PostgresRoleAdapter({ table: 'roles' });
      await adapter.addRole('user', { can: ['a'] });
      let roles = await adapter.getRoles();
      expect(roles.user.can).to.deep.equal(['a']);

      await adapter.updateRoles({ user: { can: ['b'] }, admin: { can: ['c'] } });
      roles = await adapter.getRoles();
      expect(roles.user.can).to.deep.equal(['b']);
      expect(roles.admin.can).to.deep.equal(['c']);
    });

    it('should work with custom columns', async () => {
      const { PostgresRoleAdapter } = require('../src/adapters/postgres');
      const adapter = new PostgresRoleAdapter({
        table: 'roles',
        columns: { name: 'rname', role: 'rdef', tenantId: 'tid' }
      });
      await adapter.addRole('user', { can: ['a'] });
      const roles = await adapter.getRoles();
      expect(roles.user.can).to.deep.equal(['a']);
    });

    it('should update roles with custom columns', async () => {
      const { PostgresRoleAdapter } = require('../src/adapters/postgres');
      const adapter = new PostgresRoleAdapter({
        table: 'roles',
        columns: { name: 'rname', role: 'rdef', tenantId: 'tid' }
      });
      await adapter.updateRoles({ user: { can: ['c'] } });
      const roles = await adapter.getRoles();
      expect(roles.user.can).to.deep.equal(['c']);
    });

    it('should respect the table option', async () => {
      const { PostgresRoleAdapter } = require('../src/adapters/postgres');
      const adapter = new PostgresRoleAdapter({ table: 'custom_roles' });
      await adapter.addRole('user', { can: ['a'] });
      expect(lastPGClient.tables).to.have.property('custom_roles');
      const roles = await adapter.getRoles();
      expect(roles.user.can).to.deep.equal(['a']);
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

      expect(aFind).to.be.true;
      expect(bFind).to.be.true;
      expect(aWrong).to.be.false;
    });
  });
});
