import { createPermissionChecker } from './core/permission-checker';
import { flattenRoles } from './core/role-mapper';
import type { RBACConfig, Role, Roles } from './types';

export type { RBACConfig, Role, Roles } from './types';

const RBAC =
  <P>(config: RBACConfig = {}) =>
  (roles: Roles<P>) => {
    let allRoles = { ...roles };
    let mappedRoles = flattenRoles(allRoles);
    const matchCache = new Map<string, Map<string, boolean>>();
    const checker = createPermissionChecker<P>(config);
    let checkPermission = checker(mappedRoles, matchCache);

    const canFn = (
      role: string,
      operation: string | RegExp,
      params?: P
    ) => checkPermission(role, operation, params);

    const updateRoles = (newRoles: Roles<P>): void => {
      allRoles = { ...allRoles, ...newRoles };
      mappedRoles = flattenRoles(allRoles);
      matchCache.clear();
      checkPermission = checker(mappedRoles, matchCache);
    };

    const addRole = (roleName: string, roleDef: Role<P>): void => {
      updateRoles({ [roleName]: roleDef });
    };

    return {
      can: canFn,
      updateRoles,
      addRole
    };
  };

export default RBAC;
