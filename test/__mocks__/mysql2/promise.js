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
  // Update the global reference
  global.lastMySQLConnection = lastMySQLConnection;
  return Promise.resolve(lastMySQLConnection);
}

// Initialize global variable
global.lastMySQLConnection = undefined;

module.exports = {
  createConnection: fakeCreateConnection
};
