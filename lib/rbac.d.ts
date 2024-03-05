interface RoleDefinition {
    can: {
        [operation: string]: boolean | ((params?: any, callback?: (err: Error | null, result: boolean) => void) => void) | Promise<boolean>;
    };
    inherits?: string[];
}
interface Roles {
    [role: string]: RoleDefinition;
}
interface Config {
    logger?: (role: string, operation: string, result: boolean) => void;
    enableLogger?: boolean;
}
declare const can: (config?: Config) => (mappedRoles: Roles) => (role: string, operation: string, params?: any) => Promise<boolean>;
declare const RBAC: (config: Config) => (roles: Roles) => {
    can: (role: string, operation: string, params?: any) => Promise<boolean>;
};
export default RBAC;
