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
  [key: string]: any;
}

export class PostgresRoleAdapter<P = unknown> implements RoleAdapter<P> {
  private client: any;
  private connected = false;
  private defaultTenant = 'default';
  constructor(private options: PostgresAdapterOptions) {
    const { Client } = loadPG();
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
    const res = await client.query(
      `SELECT name, role FROM ${this.options.table} WHERE tenant_id = $1`,
      [tenantId ?? this.defaultTenant]
    );
    return (res.rows as any[]).reduce<Roles<P>>((acc, row) => {
      acc[row.name] = JSON.parse(row.role);
      return acc;
    }, {} as Roles<P>);
  }

  async addRole(roleName: string, role: Role<P>, tenantId?: string): Promise<void> {
    const client = await this.getClient();
    await client.query(
      `INSERT INTO ${this.options.table}(name, role, tenant_id) VALUES ($1, $2, $3)`,
      [roleName, JSON.stringify(role), tenantId ?? this.defaultTenant]
    );
  }

  async updateRoles(roles: Roles<P>, tenantId?: string): Promise<void> {
    const client = await this.getClient();
    await Promise.all(
      Object.entries(roles).map(([name, role]) =>
        client.query(
          `INSERT INTO ${this.options.table}(name, role, tenant_id) VALUES ($1, $2, $3) ON CONFLICT (name, tenant_id) DO UPDATE SET role = EXCLUDED.role`,
          [name, JSON.stringify(role), tenantId ?? this.defaultTenant]
        )
      )
    );
  }
}
