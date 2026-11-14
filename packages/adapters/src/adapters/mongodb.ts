import type { Role, Roles } from '@rbac/core';
import type { RoleAdapter } from './adapter';
import { resolveColumns, resolveTenant, rowsToRoles } from './common';
import type { AdapterColumnOptions, AdapterColumns } from './common';
import type { MongoCollection, MongoConnection, MongoDriver } from './driver-types';
import { connectOnce, loadOptionalDriver } from './driver-utils';

let MongoClient: MongoDriver['MongoClient'] | undefined;
const loadMongoClient = (): MongoDriver['MongoClient'] => {
  if (!MongoClient) {
    MongoClient = loadOptionalDriver<MongoDriver>('mongodb', 'MongoRoleAdapter').MongoClient;
  }
  return MongoClient;
};

export interface MongoAdapterOptions {
  uri: string;
  dbName: string;
  collection: string;
  columns?: AdapterColumnOptions;
}

export class MongoRoleAdapter<P = unknown> implements RoleAdapter<P> {
  private readonly client: MongoConnection;
  private readonly columns: AdapterColumns;
  private readonly getCollection = connectOnce<MongoCollection>(async () => {
    await this.client.connect();
    return this.client.db(this.options.dbName).collection(this.options.collection);
  });

  constructor(private readonly options: MongoAdapterOptions) {
    const Mongo = loadMongoClient();
    this.client = new Mongo(options.uri);
    this.columns = resolveColumns(options.columns, 'tenantId');
  }

  async getRoles(tenantId?: string): Promise<Roles<P>> {
    const col = await this.getCollection();
    const cols = this.columns;
    const docs = await col
      .find({ [cols.tenantId]: resolveTenant(tenantId) })
      .toArray();
    return rowsToRoles<P>(docs, cols, value => value as Role<P>);
  }

  async addRole(roleName: string, role: Role<P>, tenantId?: string): Promise<void> {
    const col = await this.getCollection();
    const cols = this.columns;
    await col.insertOne({
      [cols.name]: roleName,
      [cols.role]: role,
      [cols.tenantId]: resolveTenant(tenantId)
    });
  }

  async updateRoles(roles: Roles<P>, tenantId?: string): Promise<void> {
    const col = await this.getCollection();
    const cols = this.columns;
    await Promise.all(
      Object.entries(roles).map(([name, role]) =>
        col.updateOne(
          { [cols.name]: name, [cols.tenantId]: resolveTenant(tenantId) },
          { $set: { [cols.role]: role } },
          { upsert: true }
        )
      )
    );
  }
}
