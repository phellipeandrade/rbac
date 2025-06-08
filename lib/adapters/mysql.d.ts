import type { Role, Roles } from '../types';
import type { RoleAdapter } from './adapter';
export interface MySQLAdapterOptions {
    uri?: string;
    config?: any;
    table: string;
}
export declare class MySQLRoleAdapter<P = unknown> implements RoleAdapter<P> {
    private options;
    private connection?;
    constructor(options: MySQLAdapterOptions);
    private getConnection;
    getRoles(): Promise<Roles<P>>;
    addRole(roleName: string, role: Role<P>): Promise<void>;
    updateRoles(roles: Roles<P>): Promise<void>;
}
