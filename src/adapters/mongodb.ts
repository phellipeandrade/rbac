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
}

export class MongoRoleAdapter<P = unknown> implements RoleAdapter<P> {
  private client: any;
  private db?: any;
  private collectionName: string;
  constructor(private options: MongoAdapterOptions) {
    const Mongo = loadMongoClient();
    this.client = new Mongo(options.uri);
    this.collectionName = options.collection;
  }

  private async getCollection(): Promise<any> {
    if (!this.db) {
      await this.client.connect();
      this.db = this.client.db(this.options.dbName);
    }
    return this.db.collection(this.collectionName);
  }

  async getRoles(): Promise<Roles<P>> {
    const col = await this.getCollection();
    const docs = await col.find({}).toArray();
    return (docs as any[]).reduce<Roles<P>>((acc, doc) => ({ ...acc, [doc.name]: (doc as any).role }), {} as Roles<P>);
  }

  async addRole(roleName: string, role: Role<P>): Promise<void> {
    const col = await this.getCollection();
    await col.insertOne({ name: roleName, role });
  }

  async updateRoles(roles: Roles<P>): Promise<void> {
    const col = await this.getCollection();
    await Promise.all(
      Object.entries(roles).map(([name, role]) =>
        col.updateOne({ name }, { $set: { role } }, { upsert: true })
      )
    );
  }
}
