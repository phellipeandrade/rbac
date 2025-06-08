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

export interface PostgresAdapterOptions {
  table: string;
  columns?: {
    name?: string;
    role?: string;
    tenantId?: string;
  };
  [key: string]: any;
}

export class PostgresRoleAdapter<P = unknown> implements RoleAdapter<P> {
  private client: any;
  private connected = false;
  private defaultTenant = 'default';
  constructor(private options: PostgresAdapterOptions) {
    const { Client } = loadPG();
    this.options.columns = {
      name: 'name',
      role: 'role',
      tenantId: 'tenant_id',
      ...this.options.columns
    };
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
    const cols = this.options.columns as {
      name: string;
      role: string;
      tenantId: string;
    };
    const res = await client.query(
      `SELECT ${cols.name}, ${cols.role} FROM ${this.options.table} WHERE ${cols.tenantId} = $1`,
      [tenantId ?? this.defaultTenant]
    );
    return (res.rows as any[]).reduce<Roles<P>>((acc, row) => {
      acc[row[cols.name]] = JSON.parse(row[cols.role]);
      return acc;
    }, {} as Roles<P>);
  }

  async addRole(roleName: string, role: Role<P>, tenantId?: string): Promise<void> {
    const client = await this.getClient();
    const cols = this.options.columns as {
      name: string;
      role: string;
      tenantId: string;
    };
    await client.query(
      `INSERT INTO ${this.options.table}(${cols.name}, ${cols.role}, ${cols.tenantId}) VALUES ($1, $2, $3)`,
      [roleName, JSON.stringify(role), tenantId ?? this.defaultTenant]
    );
  }

  async updateRoles(roles: Roles<P>, tenantId?: string): Promise<void> {
    const client = await this.getClient();
    const cols = this.options.columns as {
      name: string;
      role: string;
      tenantId: string;
    };
    await Promise.all(
      Object.entries(roles).map(([name, role]) =>
        client.query(
          `INSERT INTO ${this.options.table}(${cols.name}, ${cols.role}, ${cols.tenantId}) VALUES ($1, $2, $3) ON CONFLICT (${cols.name}, ${cols.tenantId}) DO UPDATE SET ${cols.role} = EXCLUDED.${cols.role}`,
          [name, JSON.stringify(role), tenantId ?? this.defaultTenant]
        )
      )
    );
  }
}
