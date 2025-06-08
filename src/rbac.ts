import {
  isFunction,
  isPromise,
  isString,
  isGlob,
  globToRegex,
  checkRegex,
  defaultLogger,
  validators,
  regexFromOperation,
  globsFromFoundedRole,
  When,
  GlobFromRole
} from './helpers';

export interface RBACConfig {
  logger?: (role: string, operation: string | RegExp, result: boolean) => void;
  enableLogger?: boolean;
}

export interface Role<P = unknown> {
  can: Array<string | { name: string; when: When<P> }>;
  inherits?: string[];
}

export type Roles<P = unknown> = Record<string, Role<P>>;

interface MappedRole<P = unknown> {
  can: Record<string, When<P> | true>;
  inherits?: string[];
  globs: GlobFromRole<P>[];
}

type MappedRoles<P = unknown> = Record<string, MappedRole<P>>;

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

      validators.role(role);
      validators.operation(operation);
      validators.foundedRole(foundedRole);

      const direct = foundedRole.can[operation as string];
      const regexOperation = regexFromOperation(operation);
      const isGlobOperation = isGlob(operation);

      if (isString(operation) && direct === true) {
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
        if (isPromise(when)) {
          try {
            const res = await when;
            return res ? log(role, operation, Boolean(res), logEnabled) : checkInherits();
          } catch {
            return log(role, operation, false, logEnabled);
          }
        }
        if (isFunction(when)) {
          return new Promise<boolean>((resolve, reject) => {
            (when as any)(params, (err: unknown, result?: boolean) => {
              if (err) return reject(err);
              resolve(Boolean(result));
            });
          })
            .then(res => (res ? log(role, operation, true, logEnabled) : checkInherits()))
            .catch(() => log(role, operation, false, logEnabled));
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
  roleCan.reduce<Record<string, When<P> | true>>(
    (acc, operation) =>
      typeof operation === 'string'
        ? { ...acc, [operation]: true }
        : { ...acc, [operation.name]: operation.when },
    {}
  );

const mapRoles = <P>(roles: Roles<P>): MappedRoles<P> => {
  validators.roles(roles);
  return Object.entries(roles).reduce<MappedRoles<P>>((acc, role) => {
    const [roleName, roleValue] = role;
    const mappedCan = roleCanMap(roleValue.can);
    return {
      ...acc,
      [roleName]: {
        can: mappedCan,
        inherits: roleValue.inherits,
        globs: globsFromFoundedRole(mappedCan)
      }
    };
  }, {} as MappedRoles<P>);
};

const RBAC =
  <P>(config: RBACConfig = {}) =>
  (roles: Roles<P>) => ({
    can: can<P>(config)(mapRoles(roles))
  });

export default RBAC;
