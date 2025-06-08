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

export interface MySQLAdapterOptions {
  uri?: string;
  config?: any;
  table: string;
}

export class MySQLRoleAdapter<P = unknown> implements RoleAdapter<P> {
  private connection?: any;
  private defaultTenant = 'default';
  constructor(private options: MySQLAdapterOptions) {}

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
    const [rows] = await conn.query(
      `SELECT name, role FROM \`${this.options.table}\` WHERE tenant_id = ?`,
      [tenantId ?? this.defaultTenant]
    );
    return (rows as any[]).reduce<Roles<P>>((acc, row) => {
      acc[row.name] = JSON.parse(row.role);
      return acc;
    }, {} as Roles<P>);
  }

  async addRole(roleName: string, role: Role<P>, tenantId?: string): Promise<void> {
    const conn = await this.getConnection();
    await conn.query(
      `INSERT INTO \`${this.options.table}\` (name, role, tenant_id) VALUES (?, ?, ?)`,
      [roleName, JSON.stringify(role), tenantId ?? this.defaultTenant]
    );
  }

  async updateRoles(roles: Roles<P>, tenantId?: string): Promise<void> {
    const conn = await this.getConnection();
    await Promise.all(
      Object.entries(roles).map(([name, role]) =>
        conn.query(
          `REPLACE INTO \`${this.options.table}\` (name, role, tenant_id) VALUES (?, ?, ?)`,
          [name, JSON.stringify(role), tenantId ?? this.defaultTenant]
        )
      )
    );
  }
}
