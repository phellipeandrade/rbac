import type { Role, Roles } from '../types';
import type { RoleAdapter } from './adapter';
export interface MongoAdapterOptions {
    uri: string;
    dbName: string;
    collection: string;
}
export declare class MongoRoleAdapter<P = unknown> implements RoleAdapter<P> {
    private options;
    private client;
    private db?;
    private collectionName;
    constructor(options: MongoAdapterOptions);
    private getCollection;
    getRoles(): Promise<Roles<P>>;
    addRole(roleName: string, role: Role<P>): Promise<void>;
    updateRoles(roles: Roles<P>): Promise<void>;
}
