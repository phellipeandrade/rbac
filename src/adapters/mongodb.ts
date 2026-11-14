let MongoClient: any;
function loadMongoClient() {
  if (!MongoClient) {
    try {
      MongoClient = require('mongodb').MongoClient;
    } catch (err) {
      throw new Error('Please install "mongodb" to use MongoRoleAdapter');
    }
  }
  return MongoClient;
}
import type { Role, Roles } from '../types';
import type { RoleAdapter } from './adapter';
import { resolveColumns, resolveTenant, rowsToRoles } from './common';
import type { AdapterColumnOptions, AdapterColumns } from './common';

export interface MongoAdapterOptions {
  uri: string;
  dbName: string;
  collection: string;
  columns?: AdapterColumnOptions;
}

export class MongoRoleAdapter<P = unknown> implements RoleAdapter<P> {
  private client: any;
  private db?: any;
  private collectionName: string;
  private readonly columns: AdapterColumns;
  constructor(private options: MongoAdapterOptions) {
    const Mongo = loadMongoClient();
    this.client = new Mongo(options.uri);
    this.collectionName = options.collection;
    this.columns = resolveColumns(options.columns, 'tenantId');
  }

  private async getCollection(): Promise<any> {
    if (!this.db) {
      await this.client.connect();
      this.db = this.client.db(this.options.dbName);
    }
    return this.db.collection(this.collectionName);
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
