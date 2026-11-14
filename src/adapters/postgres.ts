let PG: any;
function loadPG() {
  if (!PG) {
    try {
      PG = require('pg');
    } catch (err) {
      throw new Error('Please install "pg" to use PostgresRoleAdapter');
    }
  }
  return PG;
}
import type { Role, Roles } from '../types';
import type { RoleAdapter } from './adapter';
import { parseStoredRole, resolveColumns, resolveTenant, rowsToRoles } from './common';
import type { AdapterColumnOptions, AdapterColumns } from './common';

export interface PostgresAdapterOptions {
  table: string;
  columns?: AdapterColumnOptions;
  [key: string]: any;
}

export class PostgresRoleAdapter<P = unknown> implements RoleAdapter<P> {
  private client: any;
  private connected = false;
  private readonly columns: AdapterColumns;
  constructor(private options: PostgresAdapterOptions) {
    const { Client } = loadPG();
    this.columns = resolveColumns(options.columns, 'tenant_id');
    this.client = new Client(options);
  }

  private async getClient(): Promise<any> {
    if (!this.connected) {
      await this.client.connect();
      this.connected = true;
    }
    return this.client;
  }

  async getRoles(tenantId?: string): Promise<Roles<P>> {
    const client = await this.getClient();
    const cols = this.columns;
    const res = await client.query(
      `SELECT ${cols.name}, ${cols.role} FROM ${this.options.table} WHERE ${cols.tenantId} = $1`,
      [resolveTenant(tenantId)]
    );
    return rowsToRoles<P>(res.rows, cols, parseStoredRole);
  }

  async addRole(roleName: string, role: Role<P>, tenantId?: string): Promise<void> {
    const client = await this.getClient();
    const cols = this.columns;
    await client.query(
      `INSERT INTO ${this.options.table}(${cols.name}, ${cols.role}, ${cols.tenantId}) VALUES ($1, $2, $3)`,
      [roleName, JSON.stringify(role), resolveTenant(tenantId)]
    );
  }

  async updateRoles(roles: Roles<P>, tenantId?: string): Promise<void> {
    const client = await this.getClient();
    const cols = this.columns;
    await Promise.all(
      Object.entries(roles).map(([name, role]) =>
        client.query(
          `INSERT INTO ${this.options.table}(${cols.name}, ${cols.role}, ${cols.tenantId}) VALUES ($1, $2, $3) ON CONFLICT (${cols.name}, ${cols.tenantId}) DO UPDATE SET ${cols.role} = EXCLUDED.${cols.role}`,
          [name, JSON.stringify(role), resolveTenant(tenantId)]
        )
      )
    );
  }
}
