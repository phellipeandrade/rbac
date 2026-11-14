import type { Role, Roles } from '@rbac/core';
import type { RoleAdapter } from './adapter';
import { parseStoredRole, quoteSQLIdentifier, resolveColumns, resolveTenant, rowsToRoles } from './common';
import type { AdapterColumnOptions, AdapterColumns } from './common';
import type { MySQLConnection, MySQLDriver } from './driver-types';
import { connectOnce, loadOptionalDriver } from './driver-utils';

let mysql: MySQLDriver | undefined;
const loadMySQL = (): MySQLDriver => {
  if (!mysql) {
    mysql = loadOptionalDriver<MySQLDriver>('mysql2/promise', 'MySQLRoleAdapter');
  }
  return mysql;
};

export interface MySQLAdapterOptions {
  uri?: string;
  config?: string | object;
  table: string;
  columns?: AdapterColumnOptions;
}

export class MySQLRoleAdapter<P = unknown> implements RoleAdapter<P> {
  private readonly columns: AdapterColumns;
  private readonly table: string;
  private readonly sqlColumns: AdapterColumns;
  private readonly getConnection = connectOnce<MySQLConnection>(async () => {
    const driver = loadMySQL();
    return driver.createConnection(this.options.uri || this.options.config || {});
  });

  constructor(private readonly options: MySQLAdapterOptions) {
    this.columns = resolveColumns(options.columns, 'tenant_id');
    this.table = quoteSQLIdentifier(options.table, 'mysql', true);
    this.sqlColumns = {
      name: quoteSQLIdentifier(this.columns.name, 'mysql'),
      role: quoteSQLIdentifier(this.columns.role, 'mysql'),
      tenantId: quoteSQLIdentifier(this.columns.tenantId, 'mysql')
    };
  }

  async getRoles(tenantId?: string): Promise<Roles<P>> {
    const conn = await this.getConnection();
    const cols = this.sqlColumns;
    const [rows] = await conn.query<Array<Record<string, unknown>>>(
      `SELECT ${cols.name}, ${cols.role} FROM ${this.table} WHERE ${cols.tenantId} = ?`,
      [resolveTenant(tenantId)]
    );
    return rowsToRoles<P>(rows, this.columns, parseStoredRole);
  }

  async addRole(roleName: string, role: Role<P>, tenantId?: string): Promise<void> {
    const conn = await this.getConnection();
    const cols = this.sqlColumns;
    await conn.query(
      `INSERT INTO ${this.table} (${cols.name}, ${cols.role}, ${cols.tenantId}) VALUES (?, ?, ?)`,
      [roleName, JSON.stringify(role), resolveTenant(tenantId)]
    );
  }

  async updateRoles(roles: Roles<P>, tenantId?: string): Promise<void> {
    const conn = await this.getConnection();
    const cols = this.sqlColumns;
    await Promise.all(
      Object.entries(roles).map(([name, role]) =>
        conn.query(
          `REPLACE INTO ${this.table} (${cols.name}, ${cols.role}, ${cols.tenantId}) VALUES (?, ?, ?)`,
          [name, JSON.stringify(role), resolveTenant(tenantId)]
        )
      )
    );
  }
}
