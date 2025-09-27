import { describe, expect, it, jest } from '@jest/globals';

class FakeMongoCollection {
  docs: Array<Record<string, unknown>>;

  constructor() {
    this.docs = [];
  }

  find(query: Record<string, unknown> = {}) {
    return {
      toArray: async () =>
        this.docs
          .filter(doc =>
            Object.keys(query).every(key => doc[key] === query[key])
          )
          .map(doc => ({ ...doc }))
    };
  }

  insertOne(doc: Record<string, unknown>) {
    this.docs.push(doc);
    return Promise.resolve();
  }

  updateOne(
    filter: Record<string, unknown>,
    update: { $set: Record<string, unknown> },
    options?: { upsert?: boolean }
  ) {
    const idx = this.docs.findIndex(doc =>
      Object.keys(filter).every(key => doc[key] === filter[key])
    );
    if (idx >= 0) {
      Object.assign(this.docs[idx], update.$set);
    } else if (options?.upsert) {
      this.docs.push({ ...filter, ...update.$set });
    }
    return Promise.resolve();
  }
}

class FakeMongoDB {
  collections: Record<string, FakeMongoCollection>;

  constructor() {
    this.collections = {};
  }

  collection(name: string) {
    if (!this.collections[name]) {
      this.collections[name] = new FakeMongoCollection();
    }
    return this.collections[name];
  }
}

class FakeMongoClient {
  uri: string;
  dbInstance: FakeMongoDB;

  constructor(uri: string) {
    this.uri = uri;
    this.dbInstance = new FakeMongoDB();
  }

  connect() {
    return Promise.resolve();
  }

  db() {
    return this.dbInstance;
  }
}

class FakeMySQLConnection {
  tables: Record<string, Record<string, Record<string, unknown>>>;

  constructor() {
    this.tables = {};
  }

  async query(sql: string, params: unknown[]) {
    if (sql.trim().startsWith('SELECT')) {
      const tenantId = params[0] as string;
      const tableMatch = sql.match(/FROM\s+`?(\w+)`?/i);
      const table = tableMatch ? tableMatch[1] : 'roles';
      const columnsMatch = sql.match(/SELECT\s+`?(\w+)`?,\s*`?(\w+)`?\s+FROM/i);
      const nameCol = columnsMatch ? columnsMatch[1] : 'name';
      const roleCol = columnsMatch ? columnsMatch[2] : 'role';
      const tenantTable = (this.tables[table] || {})[tenantId] || {};
      const rows = Object.entries(tenantTable).map(([name, role]) => ({
        [nameCol]: name,
        [roleCol]: JSON.stringify(role)
      }));
      return [rows];
    }
    if (/INSERT INTO/.test(sql) || /REPLACE INTO/.test(sql)) {
      const [name, roleStr, tenantId] = params as [string, string, string];
      const tableMatch = sql.match(/INTO\s+`?(\w+)`?/i);
      const table = tableMatch ? tableMatch[1] : 'roles';
      this.tables[table] = this.tables[table] || {};
      this.tables[table][tenantId] = this.tables[table][tenantId] || {};
      this.tables[table][tenantId][name] = JSON.parse(roleStr);
      return [];
    }
    return [];
  }
}

let lastMySQLConnection: FakeMySQLConnection | undefined;

function createFakeMySQLConnection() {
  lastMySQLConnection = new FakeMySQLConnection();
  return Promise.resolve(lastMySQLConnection);
}

class FakePGClient {
  tables: Record<string, Record<string, Record<string, unknown>>>;

  constructor() {
    this.tables = {};
  }

  connect() {
    return Promise.resolve();
  }

  async query(sql: string, params: unknown[]) {
    if (sql.trim().startsWith('SELECT')) {
      const tenantId = params[0] as string;
      const tableMatch = sql.match(/FROM\s+(\w+)/i);
      const table = tableMatch ? tableMatch[1] : 'roles';
      const columnsMatch = sql.match(/SELECT\s+(\w+),\s*(\w+)\s+FROM/i);
      const nameCol = columnsMatch ? columnsMatch[1] : 'name';
      const roleCol = columnsMatch ? columnsMatch[2] : 'role';
      const tenantTable = (this.tables[table] || {})[tenantId] || {};
      return {
        rows: Object.entries(tenantTable).map(([name, role]) => ({
          [nameCol]: name,
          [roleCol]: JSON.stringify(role)
        }))
      };
    }
    if (sql.trim().startsWith('INSERT')) {
      const [name, roleStr, tenantId] = params as [string, string, string];
      const tableMatch = sql.match(/INTO\s+(\w+)/i);
      const table = tableMatch ? tableMatch[1] : 'roles';
      this.tables[table] = this.tables[table] || {};
      this.tables[table][tenantId] = this.tables[table][tenantId] || {};
      this.tables[table][tenantId][name] = JSON.parse(roleStr);
      return {};
    }
    return {};
  }
}

let lastPGClient: FakePGClient | undefined;

jest.mock('mongodb', () => ({ MongoClient: FakeMongoClient }), { virtual: true });

jest.mock('mysql2/promise', () => ({
  createConnection: createFakeMySQLConnection
}), { virtual: true });

jest.mock('pg', () => ({
  Client: function () {
    lastPGClient = new FakePGClient();
    return lastPGClient;
  }
}), { virtual: true });

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
      expect(lastMySQLConnection?.tables).toHaveProperty('custom_roles');
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
      expect(lastPGClient?.tables).toHaveProperty('custom_roles');
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
