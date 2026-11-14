let mysql: any;
function loadMySQL() {
  if (!mysql) {
    try {
      mysql = require('mysql2/promise');
    } catch (err) {
      throw new Error('Please install "mysql2" to use MySQLRoleAdapter');
    }
  }
  return mysql;
}
import type { Role, Roles } from '../types';
import type { RoleAdapter } from './adapter';
import { parseStoredRole, resolveColumns, resolveTenant, rowsToRoles } from './common';
import type { AdapterColumnOptions, AdapterColumns } from './common';

export interface MySQLAdapterOptions {
  uri?: string;
  config?: any;
  table: string;
  columns?: AdapterColumnOptions;
}

export class MySQLRoleAdapter<P = unknown> implements RoleAdapter<P> {
  private connection?: any;
  private readonly columns: AdapterColumns;
  constructor(private options: MySQLAdapterOptions) {
    this.columns = resolveColumns(options.columns, 'tenant_id');
  }

  private async getConnection(): Promise<any> {
    if (!this.connection) {
      const driver = loadMySQL();
      this.connection = this.options.uri
        ? await driver.createConnection(this.options.uri)
        : await driver.createConnection(this.options.config || {});
    }
    return this.connection;
  }

  async getRoles(tenantId?: string): Promise<Roles<P>> {
    const conn = await this.getConnection();
    const cols = this.columns;
    const [rows] = await conn.query(
      `SELECT \`${cols.name}\`, \`${cols.role}\` FROM \`${this.options.table}\` WHERE \`${cols.tenantId}\` = ?`,
      [resolveTenant(tenantId)]
    );
    return rowsToRoles<P>(rows, cols, parseStoredRole);
  }

  async addRole(roleName: string, role: Role<P>, tenantId?: string): Promise<void> {
    const conn = await this.getConnection();
    const cols = this.columns;
    await conn.query(
      `INSERT INTO \`${this.options.table}\` (\`${cols.name}\`, \`${cols.role}\`, \`${cols.tenantId}\`) VALUES (?, ?, ?)`,
      [roleName, JSON.stringify(role), resolveTenant(tenantId)]
    );
  }

  async updateRoles(roles: Roles<P>, tenantId?: string): Promise<void> {
    const conn = await this.getConnection();
    const cols = this.columns;
    await Promise.all(
      Object.entries(roles).map(([name, role]) =>
        conn.query(
          `REPLACE INTO \`${this.options.table}\` (\`${cols.name}\`, \`${cols.role}\`, \`${cols.tenantId}\`) VALUES (?, ?, ?)`,
          [name, JSON.stringify(role), resolveTenant(tenantId)]
        )
      )
    );
  }
}
