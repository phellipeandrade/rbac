/* global describe, it, before, after */
import chai from 'chai';
import Module from 'module';

const expect = chai.expect;

// --- Stubs for database drivers ---
class FakeMongoCollection {
  constructor() {
    this.docs = [];
  }
  find(query = {}) {
    return {
      toArray: async () =>
        this.docs
          .filter(d => Object.keys(query).every(k => d[k] === query[k]))
          .map(d => ({ ...d }))
    };
  }
  insertOne(doc) {
    this.docs.push(doc);
    return Promise.resolve();
  }
  updateOne(filter, update, options) {
    const idx = this.docs.findIndex(d =>
      Object.keys(filter).every(k => d[k] === filter[k])
    );
    if (idx >= 0) {
      Object.assign(this.docs[idx], update.$set);
    } else if (options && options.upsert) {
      this.docs.push({ ...filter, ...update.$set });
    }
    return Promise.resolve();
  }
}
class FakeMongoDB {
  constructor() {
    this.collections = {};
  }
  collection(name) {
    if (!this.collections[name]) {
      this.collections[name] = new FakeMongoCollection();
    }
    return this.collections[name];
  }
}
class FakeMongoClient {
  constructor(uri) {
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
  constructor() {
    this.tables = {};
  }
  async query(sql, params) {
    if (sql.trim().startsWith('SELECT')) {
      const tenantId = params[0];
      const tableMatch = sql.match(/FROM\s+`?(\w+)`?/i);
      const table = tableMatch ? tableMatch[1] : 'roles';
      const match = sql.match(/SELECT\s+`?(\w+)`?,\s*`?(\w+)`?\s+FROM/i);
      const nameCol = match ? match[1] : 'name';
      const roleCol = match ? match[2] : 'role';
      const rows = Object.entries(((this.tables[table] || {})[tenantId] || {})).map(([name, role]) => ({ [nameCol]: name, [roleCol]: JSON.stringify(role) }));
      return [rows];
    }
    if (/INSERT INTO/.test(sql) || /REPLACE INTO/.test(sql)) {
      const [name, roleStr, tenantId] = params;
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
let lastMySQLConnection;
function fakeCreateConnection() {
  lastMySQLConnection = new FakeMySQLConnection();
  return Promise.resolve(lastMySQLConnection);
}

class FakePGClient {
  constructor() {
    this.tables = {};
  }
  connect() {
    return Promise.resolve();
  }
  async query(sql, params) {
    if (sql.trim().startsWith('SELECT')) {
      const tenantId = params[0];
      const tableMatch = sql.match(/FROM\s+(\w+)/i);
      const table = tableMatch ? tableMatch[1] : 'roles';
      const match = sql.match(/SELECT\s+(\w+),\s*(\w+)\s+FROM/i);
      const nameCol = match ? match[1] : 'name';
      const roleCol = match ? match[2] : 'role';
      return {
        rows: Object.entries(((this.tables[table] || {})[tenantId] || {})).map(([name, role]) => ({ [nameCol]: name, [roleCol]: JSON.stringify(role) }))
      };
    }
    if (sql.trim().startsWith('INSERT')) {
      const [name, roleStr, tenantId] = params;
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
let lastPGClient;

// --- Module mocking helpers ---
const originalLoad = Module._load;
function setupMocks() {
  Module._load = function(request, parent, isMain) {
    if (request === 'mongodb') {
      return { MongoClient: FakeMongoClient };
    }
    if (request === 'mysql2/promise') {
      return { createConnection: fakeCreateConnection };
    }
    if (request === 'pg') {
      return { Client: function() { lastPGClient = new FakePGClient(); return lastPGClient; } };
    }
    return originalLoad.call(this, request, parent, isMain);
  };
}
function restoreMocks() {
  Module._load = originalLoad;
}

// apply mocks before other test files load dependencies
setupMocks();

// --- Tests ---
describe('Role Adapters', () => {
  after(() => {
    restoreMocks();
  });

  describe('MongoRoleAdapter', () => {
    it('should add and retrieve roles', async () => {
      const { MongoRoleAdapter } = require('../lib/adapters/mongodb');
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
      const { MongoRoleAdapter } = require('../lib/adapters/mongodb');
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
      const { MongoRoleAdapter } = require('../lib/adapters/mongodb');
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
      const { MongoRoleAdapter } = require('../lib/adapters/mongodb');
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
      const { MySQLRoleAdapter } = require('../lib/adapters/mysql');
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
      const { MySQLRoleAdapter } = require('../lib/adapters/mysql');
      const adapter = new MySQLRoleAdapter({
        table: 'roles',
        columns: { name: 'rname', role: 'rdef', tenantId: 'tid' }
      });
      await adapter.addRole('user', { can: ['a'] });
      const roles = await adapter.getRoles();
      expect(roles.user.can).to.deep.equal(['a']);
    });

    it('should update roles with custom columns', async () => {
      const { MySQLRoleAdapter } = require('../lib/adapters/mysql');
      const adapter = new MySQLRoleAdapter({
        table: 'roles',
        columns: { name: 'rname', role: 'rdef', tenantId: 'tid' }
      });
      await adapter.updateRoles({ user: { can: ['c'] } });
      const roles = await adapter.getRoles();
      expect(roles.user.can).to.deep.equal(['c']);
    });

    it('should respect the table option', async () => {
      const { MySQLRoleAdapter } = require('../lib/adapters/mysql');
      const adapter = new MySQLRoleAdapter({ table: 'custom_roles' });
      await adapter.addRole('user', { can: ['a'] });
      expect(lastMySQLConnection.tables).to.have.property('custom_roles');
      const roles = await adapter.getRoles();
      expect(roles.user.can).to.deep.equal(['a']);
    });
  });

  describe('PostgresRoleAdapter', () => {
    it('should add and retrieve roles', async () => {
      const { PostgresRoleAdapter } = require('../lib/adapters/postgres');
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
      const { PostgresRoleAdapter } = require('../lib/adapters/postgres');
      const adapter = new PostgresRoleAdapter({
        table: 'roles',
        columns: { name: 'rname', role: 'rdef', tenantId: 'tid' }
      });
      await adapter.addRole('user', { can: ['a'] });
      const roles = await adapter.getRoles();
      expect(roles.user.can).to.deep.equal(['a']);
    });

    it('should update roles with custom columns', async () => {
      const { PostgresRoleAdapter } = require('../lib/adapters/postgres');
      const adapter = new PostgresRoleAdapter({
        table: 'roles',
        columns: { name: 'rname', role: 'rdef', tenantId: 'tid' }
      });
      await adapter.updateRoles({ user: { can: ['c'] } });
      const roles = await adapter.getRoles();
      expect(roles.user.can).to.deep.equal(['c']);
    });

    it('should respect the table option', async () => {
      const { PostgresRoleAdapter } = require('../lib/adapters/postgres');
      const adapter = new PostgresRoleAdapter({ table: 'custom_roles' });
      await adapter.addRole('user', { can: ['a'] });
      expect(lastPGClient.tables).to.have.property('custom_roles');
      const roles = await adapter.getRoles();
      expect(roles.user.can).to.deep.equal(['a']);
    });
  });

  describe('multi-tenant behavior', () => {
    it('should isolate roles per tenant', async () => {
      const { MongoRoleAdapter } = require('../lib/adapters/mongodb');
      const { createTenantRBAC } = require('../lib/index');
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
