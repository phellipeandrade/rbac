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

export interface MongoAdapterOptions {
  uri: string;
  dbName: string;
  collection: string;
  columns?: {
    name?: string;
    role?: string;
    tenantId?: string;
  };
}

export class MongoRoleAdapter<P = unknown> implements RoleAdapter<P> {
  private client: any;
  private db?: any;
  private collectionName: string;
  private defaultTenant = 'default';
  constructor(private options: MongoAdapterOptions) {
    const Mongo = loadMongoClient();
    this.client = new Mongo(options.uri);
    this.collectionName = options.collection;
    this.options.columns = {
      name: 'name',
      role: 'role',
      tenantId: 'tenantId',
      ...this.options.columns
    };
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
    const cols = this.options.columns as {
      name: string;
      role: string;
      tenantId: string;
    };
    const docs = await col
      .find({ [cols.tenantId]: tenantId ?? this.defaultTenant })
      .toArray();
    return (docs as any[]).reduce<Roles<P>>(
      (acc, doc) => ({ ...acc, [doc[cols.name]]: (doc as any)[cols.role] }),
      {} as Roles<P>
    );
  }

  async addRole(roleName: string, role: Role<P>, tenantId?: string): Promise<void> {
    const col = await this.getCollection();
    const cols = this.options.columns as {
      name: string;
      role: string;
      tenantId: string;
    };
    await col.insertOne({
      [cols.name]: roleName,
      [cols.role]: role,
      [cols.tenantId]: tenantId ?? this.defaultTenant
    });
  }

  async updateRoles(roles: Roles<P>, tenantId?: string): Promise<void> {
    const col = await this.getCollection();
    const cols = this.options.columns as {
      name: string;
      role: string;
      tenantId: string;
    };
    await Promise.all(
      Object.entries(roles).map(([name, role]) =>
        col.updateOne(
          { [cols.name]: name, [cols.tenantId]: tenantId ?? this.defaultTenant },
          { $set: { [cols.role]: role } },
          { upsert: true }
        )
      )
    );
  }
}
