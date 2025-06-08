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
  columns?: {
    name?: string;
    role?: string;
    tenantId?: string;
  };
}

export class MySQLRoleAdapter<P = unknown> implements RoleAdapter<P> {
  private connection?: any;
  private defaultTenant = 'default';
  constructor(private options: MySQLAdapterOptions) {
    this.options.columns = {
      name: 'name',
      role: 'role',
      tenantId: 'tenant_id',
      ...this.options.columns
    };
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
    const cols = this.options.columns as {
      name: string;
      role: string;
      tenantId: string;
    };
    const [rows] = await conn.query(
      `SELECT \`${cols.name}\`, \`${cols.role}\` FROM \`${this.options.table}\` WHERE \`${cols.tenantId}\` = ?`,
      [tenantId ?? this.defaultTenant]
    );
    return (rows as any[]).reduce<Roles<P>>((acc, row) => {
      acc[row[cols.name]] = JSON.parse(row[cols.role]);
      return acc;
    }, {} as Roles<P>);
  }

  async addRole(roleName: string, role: Role<P>, tenantId?: string): Promise<void> {
    const conn = await this.getConnection();
    const cols = this.options.columns as {
      name: string;
      role: string;
      tenantId: string;
    };
    await conn.query(
      `INSERT INTO \`${this.options.table}\` (\`${cols.name}\`, \`${cols.role}\`, \`${cols.tenantId}\`) VALUES (?, ?, ?)`,
      [roleName, JSON.stringify(role), tenantId ?? this.defaultTenant]
    );
  }

  async updateRoles(roles: Roles<P>, tenantId?: string): Promise<void> {
    const conn = await this.getConnection();
    const cols = this.options.columns as {
      name: string;
      role: string;
      tenantId: string;
    };
    await Promise.all(
      Object.entries(roles).map(([name, role]) =>
        conn.query(
          `REPLACE INTO \`${this.options.table}\` (\`${cols.name}\`, \`${cols.role}\`, \`${cols.tenantId}\`) VALUES (?, ?, ?)`,
          [name, JSON.stringify(role), tenantId ?? this.defaultTenant]
        )
      )
    );
  }
}
