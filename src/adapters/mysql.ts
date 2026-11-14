import type { Role, Roles } from '../types';
import type { RoleAdapter } from './adapter';
import { parseStoredRole, resolveColumns, resolveTenant, rowsToRoles } from './common';
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
  private readonly getConnection = connectOnce<MySQLConnection>(async () => {
    const driver = loadMySQL();
    return driver.createConnection(this.options.uri || this.options.config || {});
  });

  constructor(private readonly options: MySQLAdapterOptions) {
    this.columns = resolveColumns(options.columns, 'tenant_id');
  }

  async getRoles(tenantId?: string): Promise<Roles<P>> {
    const conn = await this.getConnection();
    const cols = this.columns;
    const [rows] = await conn.query<Array<Record<string, unknown>>>(
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
