import type { Role, Roles } from '../types';
import type { RoleAdapter } from './adapter';
export interface PostgresAdapterOptions {
    table: string;
    [key: string]: any;
}
export declare class PostgresRoleAdapter<P = unknown> implements RoleAdapter<P> {
    private options;
    private client;
    private connected;
    constructor(options: PostgresAdapterOptions);
    private getClient;
    getRoles(): Promise<Roles<P>>;
    addRole(roleName: string, role: Role<P>): Promise<void>;
    updateRoles(roles: Roles<P>): Promise<void>;
}
