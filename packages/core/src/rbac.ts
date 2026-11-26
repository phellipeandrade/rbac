import { createPermissionChecker } from './core/permission-checker';
import { flattenRoles } from './core/role-mapper';
import type { RBACEngine, RBACOptions, Role, Roles } from './types';

/** Create a dependency-free, mutable authorization engine. */
export const createRBAC = <P = unknown>({ roles, ...config }: RBACOptions<P>): RBACEngine<P> => {
    const checker = createPermissionChecker<P>(config);
    const compileRoles = (definitions: Roles<P>) => checker(flattenRoles(definitions), new Map());
    let allRoles = { ...roles };
    let checkPermission = compileRoles(allRoles);

    const canFn = (
      role: string,
      operation: string | RegExp,
      params?: P
    ) => checkPermission(role, operation, params);

    const applyRoles = (definitions: Roles<P>): void => {
      checkPermission = compileRoles(definitions);
      allRoles = definitions;
    };

    const updateRoles = (newRoles: Roles<P>): void => {
      applyRoles({ ...allRoles, ...newRoles });
    };

    const replaceRoles = (newRoles: Roles<P>): void => {
      applyRoles({ ...newRoles });
    };

    const addRole = (roleName: string, roleDef: Role<P>): void => {
      updateRoles({ [roleName]: roleDef });
    };

    return {
      can: canFn,
      updateRoles,
      addRole,
      replaceRoles
    };
};
