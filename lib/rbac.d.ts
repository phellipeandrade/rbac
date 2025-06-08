import type { RBACConfig, Role, Roles } from './types';
export type { RBACConfig, Role, Roles } from './types';
declare const RBAC: <P>(config?: RBACConfig) => (roles: Roles<P>) => {
    can: (role: string, operation: string | RegExp, params?: P) => Promise<boolean>;
    updateRoles: (newRoles: Roles<P>) => void;
    addRole: (roleName: string, roleDef: Role<P>) => void;
};
export default RBAC;
