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
function createClient() {
  lastPGClient = new FakePGClient();
  // Update the global reference
  global.lastPGClient = lastPGClient;
  return lastPGClient;
}

// Initialize global variable
global.lastPGClient = undefined;

module.exports = {
  Client: createClient
};
