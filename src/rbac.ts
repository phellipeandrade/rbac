import {
  defaultLogger,
  regexFromOperation,
  isGlob,
  globToRegex,
  checkRegex,
  globsFromFoundedRole
} from './helpers';
import type {
  When,
  GlobFromRole,
  RBACConfig,
  Role,
  Roles,
  MappedRole,
  MappedRoles
} from './types';

export type { RBACConfig, Role, Roles } from './types';

const can =
  <P>(config: RBACConfig = { logger: defaultLogger, enableLogger: true }) =>
  (mappedRoles: MappedRoles<P>) => {
    const logger = config.logger || defaultLogger;

    const log = (
      roleName: string,
      operation: string | RegExp,
      result: boolean,
      enabled: boolean
    ): boolean => {
      if (enabled && config.enableLogger) {
        logger(roleName, operation, result);
      }
      return result;
    };

    const check = async (
      role: string,
      operation: string | RegExp,
      params?: P,
      logEnabled = true
    ): Promise<boolean> => {
      const foundedRole = mappedRoles[role];

      if (!foundedRole) {
        return log(role, operation, false, logEnabled);
      }


      const direct = foundedRole.can[operation as string];
      const regexOperation = regexFromOperation(operation);
      const isGlobOperation = isGlob(operation);

      if (typeof operation === 'string' && direct === true) {
        return log(role, operation, true, logEnabled);
      }

      if (regexOperation || isGlobOperation) {
        const regex = isGlobOperation
          ? globToRegex(operation as string)
          : (regexOperation as RegExp);
        return log(role, operation, checkRegex(regex, foundedRole.can), logEnabled);
      }

      const matchGlob = foundedRole.globs.find(g => g.regex.test(String(operation)));
      if (matchGlob) {
        return evaluateWhen(matchGlob.when);
      }

      if (!direct) {
        return checkInherits();
      }

      return evaluateWhen(direct);

      async function evaluateWhen(when: When<P> | true | undefined): Promise<boolean> {
        if (when === true) return log(role, operation, true, logEnabled);

        if (typeof when === 'function') {
          if ((when as Function).length >= 2) {
            return new Promise<boolean>((resolve, reject) => {
              (when as any)(params, (err: unknown, result?: boolean) => {
                if (err) return reject(err);
                resolve(Boolean(result));
              });
            })
              .then(res => (res ? log(role, operation, true, logEnabled) : checkInherits()))
              .catch(() => log(role, operation, false, logEnabled));
          }

          try {
            const res = (when as any)(params);
            const final = res instanceof Promise ? await res : res;
            return final ? log(role, operation, Boolean(final), logEnabled) : checkInherits();
          } catch {
            return log(role, operation, false, logEnabled);
          }
        }

        if (when instanceof Promise) {
          try {
            const res = await when;
            return res ? log(role, operation, Boolean(res), logEnabled) : checkInherits();
          } catch {
            return log(role, operation, false, logEnabled);
          }
        }

        return log(role, operation, false, logEnabled);
      }

      async function checkInherits(): Promise<boolean> {
        if (!foundedRole.inherits) return log(role, operation, false, logEnabled);
        const results = await Promise.all(
          foundedRole.inherits.map(parent => check(parent, operation, params, false))
        );
        return log(role, operation, results.some(Boolean), logEnabled);
      }
    };

    return (role: string, operation: string | RegExp, params?: P) =>
      check(role, operation, params);
  };

const roleCanMap = <P>(roleCan: Role<P>['can']): Record<string, When<P> | true> =>
  Object.fromEntries(
    roleCan.map(op =>
      typeof op === 'string' ? [op, true] : [op.name, op.when]
    )
  );

const mapRoles = <P>(roles: Roles<P>): MappedRoles<P> =>
  Object.fromEntries(
    Object.entries(roles).map(([name, role]) => {
      const can = roleCanMap(role.can);
      return [
        name,
        { can, inherits: role.inherits, globs: globsFromFoundedRole(can) }
      ];
    })
  ) as MappedRoles<P>;

const RBAC =
  <P>(config: RBACConfig = {}) =>
  (roles: Roles<P>) => {
    let allRoles = { ...roles };
    let mappedRoles = mapRoles(allRoles);
    const checker = can<P>(config);

    const canFn = (
      role: string,
      operation: string | RegExp,
      params?: P
    ) => checker(mappedRoles)(role, operation, params);

    const updateRoles = (newRoles: Roles<P>): void => {
      allRoles = { ...allRoles, ...newRoles };
      mappedRoles = mapRoles(allRoles);
    };

    const addRole = (roleName: string, roleDef: Role<P>): void => {
      allRoles = { ...allRoles, [roleName]: roleDef };
      mappedRoles = mapRoles(allRoles);
    };

    return {
      can: canFn,
      updateRoles,
      addRole
    };
  };

export default RBAC;
