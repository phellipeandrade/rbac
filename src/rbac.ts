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

    const checkDirect = async (
      logRole: string,
      foundedRole: MappedRole<P>,
      operation: string | RegExp,
      params?: P,
      logEnabled = true,
      skipFalseLog = false
    ): Promise<boolean> => {
      const direct = foundedRole.can[operation as string];
      const regexOperation = regexFromOperation(operation);
      const isGlobOperation = isGlob(operation);

      if (typeof operation === 'string' && direct === true) {
        return log(logRole, operation, true, logEnabled);
      }

      if (regexOperation || isGlobOperation) {
        const regex = isGlobOperation
          ? globToRegex(operation as string)
          : (regexOperation as RegExp);
        return log(logRole, operation, checkRegex(regex, foundedRole.can), logEnabled);
      }

      const matchGlob = foundedRole.globs.find(g => g.regex.test(String(operation)));
      if (matchGlob) {
        return evaluateWhen(matchGlob.when);
      }

      if (!direct) {
        if (!skipFalseLog) log(logRole, operation, false, logEnabled);
        return false;
      }

      return evaluateWhen(direct);

      async function evaluateWhen(when: When<P> | true | undefined): Promise<boolean> {
        if (when === true) {
          log(logRole, operation, true, logEnabled);
          return true;
        }

        if (typeof when === 'function') {
          if ((when as Function).length >= 2) {
            return new Promise<boolean>((resolve, reject) => {
              (when as any)(params, (err: unknown, result?: boolean) => {
                if (err) return reject(err);
                resolve(Boolean(result));
              });
            })
              .then(res => {
                log(logRole, operation, res, logEnabled);
                return res;
              })
              .catch(() => {
                log(logRole, operation, false, logEnabled);
                return false;
              });
          }

          try {
            const res = (when as any)(params);
            const final = res instanceof Promise ? await res : res;
            log(logRole, operation, Boolean(final), logEnabled);
            return Boolean(final);
          } catch {
            log(logRole, operation, false, logEnabled);
            return false;
          }
        }

        if (when instanceof Promise) {
          try {
            const res = await when;
            log(logRole, operation, Boolean(res), logEnabled);
            return Boolean(res);
          } catch {
            log(logRole, operation, false, logEnabled);
            return false;
          }
        }

        log(logRole, operation, false, logEnabled);
        return false;
      }
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
      return checkDirect(role, foundedRole, operation, params, logEnabled);
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

const flattenRoles = <P>(roles: Roles<P>): MappedRoles<P> => {
  const memo: MappedRoles<P> = {};
  const visit = (name: string, stack: Set<string>): MappedRole<P> => {
    if (memo[name]) return memo[name];
    if (stack.has(name)) return { can: {}, globs: [] } as MappedRole<P>;
    stack.add(name);
    const role = roles[name];
    let can: Record<string, When<P> | true> = {};
    let globs: GlobFromRole<P>[] = [];
    let inherits: string[] | undefined;
    if (role) {
      if (role.inherits) {
        inherits = role.inherits;
        for (const parent of role.inherits) {
          const parentRole = visit(parent, stack);
          can = { ...can, ...parentRole.can };
          globs.push(...parentRole.globs);
        }
      }
      const direct = roleCanMap(role.can);
      can = { ...can, ...direct };
      globs.push(...globsFromFoundedRole(direct));
    }
    stack.delete(name);
    const unique: GlobFromRole<P>[] = [];
    const seen = new Set<string>();
    for (const g of globs) {
      const key = g.role + g.regex.source;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(g);
      }
    }
    const mapped: MappedRole<P> = { can, globs: unique, inherits };
    memo[name] = mapped;
    return mapped;
  };
  for (const name of Object.keys(roles)) {
    visit(name, new Set());
  }
  return memo;
};

const RBAC =
  <P>(config: RBACConfig = {}) =>
  (roles: Roles<P>) => {
    let allRoles = { ...roles };
    let mappedRoles = flattenRoles(allRoles);
    const checker = can<P>(config);

    const canFn = (
      role: string,
      operation: string | RegExp,
      params?: P
    ) => checker(mappedRoles)(role, operation, params);

    const updateRoles = (newRoles: Roles<P>): void => {
      allRoles = { ...allRoles, ...newRoles };
      mappedRoles = flattenRoles(allRoles);
    };

    const addRole = (roleName: string, roleDef: Role<P>): void => {
      allRoles = { ...allRoles, [roleName]: roleDef };
      mappedRoles = flattenRoles(allRoles);
    };

    return {
      can: canFn,
      updateRoles,
      addRole
    };
  };

export default RBAC;
