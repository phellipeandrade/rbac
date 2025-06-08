/* global describe, it, before, after */
import chai from 'chai';
import Module from 'module';

const expect = chai.expect;

// --- Stubs for database drivers ---
class FakeMongoCollection {
  constructor() {
    this.docs = [];
  }
  find() {
    return { toArray: async () => this.docs.map(d => ({ ...d })) };
  }
  insertOne(doc) {
    this.docs.push(doc);
    return Promise.resolve();
  }
  updateOne(filter, update, options) {
    const idx = this.docs.findIndex(d => d.name === filter.name);
    if (idx >= 0) {
      this.docs[idx].role = update.$set.role;
    } else if (options && options.upsert) {
      this.docs.push({ name: filter.name, role: update.$set.role });
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
    this.roles = {};
  }
  async query(sql, params) {
    if (sql.trim().startsWith('SELECT')) {
      const rows = Object.entries(this.roles).map(([name, role]) => ({ name, role: JSON.stringify(role) }));
      return [rows];
    }
    if (/INSERT INTO/.test(sql) || /REPLACE INTO/.test(sql)) {
      const [name, roleStr] = params;
      this.roles[name] = JSON.parse(roleStr);
      return [];
    }
    return [];
  }
}
function fakeCreateConnection() {
  return Promise.resolve(new FakeMySQLConnection());
}

class FakePGClient {
  constructor() {
    this.roles = {};
  }
  connect() {
    return Promise.resolve();
  }
  async query(sql, params) {
    if (sql.trim().startsWith('SELECT')) {
      return {
        rows: Object.entries(this.roles).map(([name, role]) => ({ name, role: JSON.stringify(role) }))
      };
    }
    if (sql.trim().startsWith('INSERT')) {
      const [name, roleStr] = params;
      this.roles[name] = JSON.parse(roleStr);
      return {};
    }
    return {};
  }
}

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
      return { Client: FakePGClient };
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
  });
});
