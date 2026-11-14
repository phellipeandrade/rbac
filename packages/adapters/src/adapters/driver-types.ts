// Small structural contracts keep database drivers optional at runtime.
// Only methods used by the adapters are part of these types.
export interface MongoCollection {
  find(query: Record<string, unknown>): {
    toArray(): Promise<Array<Record<string, unknown>>>;
  };
  insertOne(document: Record<string, unknown>): Promise<unknown>;
  updateOne(
    filter: Record<string, unknown>,
    update: { $set: Record<string, unknown> },
    options: { upsert: boolean }
  ): Promise<unknown>;
}

export interface MongoDatabase {
  collection(name: string): MongoCollection;
}

export interface MongoConnection {
  connect(): Promise<unknown>;
  db(name: string): MongoDatabase;
}

export interface MongoDriver {
  MongoClient: new (uri: string) => MongoConnection;
}

export interface MySQLConnection {
  query<Result = unknown>(
    sql: string,
    params: readonly unknown[]
  ): Promise<[Result, unknown]>;
}

export interface MySQLDriver {
  createConnection(config: string | object): Promise<MySQLConnection>;
}

export interface PostgresConnection {
  connect(): Promise<unknown>;
  query<Row extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params: readonly unknown[]
  ): Promise<{ rows: Row[] }>;
}

export interface PostgresDriver {
  Client: new (config: Record<string, unknown>) => PostgresConnection;
}
