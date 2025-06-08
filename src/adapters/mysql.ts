const mysql = require('mysql2/promise');
import type { Role, Roles } from '../types';
import type { RoleAdapter } from './adapter';

export interface MySQLAdapterOptions {
  uri?: string;
  config?: any;
  table: string;
}

export class MySQLRoleAdapter<P = unknown> implements RoleAdapter<P> {
  private connection?: any;
  constructor(private options: MySQLAdapterOptions) {}

  private async getConnection(): Promise<any> {
    if (!this.connection) {
      this.connection = this.options.uri
        ? await mysql.createConnection(this.options.uri)
        : await mysql.createConnection(this.options.config || {});
    }
    return this.connection;
  }

  async getRoles(): Promise<Roles<P>> {
    const conn = await this.getConnection();
    const [rows] = await conn.query(`SELECT name, role FROM \`${this.options.table}\``);
    return (rows as any[]).reduce<Roles<P>>((acc, row) => {
      acc[row.name] = JSON.parse(row.role);
      return acc;
    }, {} as Roles<P>);
  }

  async addRole(roleName: string, role: Role<P>): Promise<void> {
    const conn = await this.getConnection();
    await conn.query(`INSERT INTO \`${this.options.table}\` (name, role) VALUES (?, ?)`, [roleName, JSON.stringify(role)]);
  }

  async updateRoles(roles: Roles<P>): Promise<void> {
    const conn = await this.getConnection();
    await Promise.all(
      Object.entries(roles).map(([name, role]) =>
        conn.query(
          `REPLACE INTO \`${this.options.table}\` (name, role) VALUES (?, ?)`,
          [name, JSON.stringify(role)]
        )
      )
    );
  }
}
