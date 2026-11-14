import type { Role, Roles } from '@rbac/core';
import type { RoleAdapter } from './adapter';
import { parseStoredRole, quoteSQLIdentifier, resolveColumns, resolveTenant, rowsToRoles } from './common';
import type { AdapterColumnOptions, AdapterColumns } from './common';
import type { PostgresConnection, PostgresDriver } from './driver-types';
import { connectOnce, loadOptionalDriver } from './driver-utils';

let PG: PostgresDriver | undefined;
const loadPG = (): PostgresDriver => {
  if (!PG) {
    PG = loadOptionalDriver<PostgresDriver>('pg', 'PostgresRoleAdapter');
  }
  return PG;
};

export interface PostgresAdapterOptions {
  table: string;
  columns?: AdapterColumnOptions;
  [key: string]: unknown;
}

export class PostgresRoleAdapter<P = unknown> implements RoleAdapter<P> {
  private readonly client: PostgresConnection;
  private readonly columns: AdapterColumns;
  private readonly table: string;
  private readonly sqlColumns: AdapterColumns;
  private readonly getClient = connectOnce<PostgresConnection>(async () => {
    await this.client.connect();
    return this.client;
  });

  constructor(private readonly options: PostgresAdapterOptions) {
    this.columns = resolveColumns(options.columns, 'tenant_id');
    this.table = quoteSQLIdentifier(options.table, 'postgres', true);
    this.sqlColumns = {
      name: quoteSQLIdentifier(this.columns.name, 'postgres'),
      role: quoteSQLIdentifier(this.columns.role, 'postgres'),
      tenantId: quoteSQLIdentifier(this.columns.tenantId, 'postgres')
    };
    const { Client } = loadPG();
    const { table: _table, columns: _columns, ...clientOptions } = options;
    this.client = new Client(clientOptions);
  }

  async getRoles(tenantId?: string): Promise<Roles<P>> {
    const client = await this.getClient();
    const cols = this.sqlColumns;
    const res = await client.query(
      `SELECT ${cols.name}, ${cols.role} FROM ${this.table} WHERE ${cols.tenantId} = $1`,
      [resolveTenant(tenantId)]
    );
    return rowsToRoles<P>(res.rows, this.columns, parseStoredRole);
  }

  async addRole(roleName: string, role: Role<P>, tenantId?: string): Promise<void> {
    const client = await this.getClient();
    const cols = this.sqlColumns;
    await client.query(
      `INSERT INTO ${this.table}(${cols.name}, ${cols.role}, ${cols.tenantId}) VALUES ($1, $2, $3)`,
      [roleName, JSON.stringify(role), resolveTenant(tenantId)]
    );
  }

  async updateRoles(roles: Roles<P>, tenantId?: string): Promise<void> {
    const client = await this.getClient();
    const cols = this.sqlColumns;
    await Promise.all(
      Object.entries(roles).map(([name, role]) =>
        client.query(
          `INSERT INTO ${this.table}(${cols.name}, ${cols.role}, ${cols.tenantId}) VALUES ($1, $2, $3) ON CONFLICT (${cols.name}, ${cols.tenantId}) DO UPDATE SET ${cols.role} = EXCLUDED.${cols.role}`,
          [name, JSON.stringify(role), resolveTenant(tenantId)]
        )
      )
    );
  }
}
