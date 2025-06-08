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
  When
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
}

type MappedRoles<P = unknown> = Record<string, MappedRole<P>>;

const can =
  <P>(
    config: RBACConfig = {
      logger: defaultLogger,
      enableLogger: true
    }
  ) =>
  (mappedRoles: MappedRoles<P>) =>
  (
    role: string,
    operation: string | RegExp,
    params?: P
  ): Promise<boolean> =>
    new Promise((resolve, reject) => {
      const foundedRole = mappedRoles[role];
      const regexOperation = regexFromOperation(operation);
      const isGlobOperation = isGlob(operation);
      const matchOperationFromCan = foundedRole.can[operation as string];

      validators.role(role);
      validators.operation(operation);
      validators.foundedRole(foundedRole);

      const resolvePromise = (roleName: string, result: boolean) => {
        if (config.enableLogger) {
          (config.logger || defaultLogger)(roleName, operation, result);
        }
        return resolve(result);
      };

      if (isString(operation) && matchOperationFromCan === true) {
        return resolvePromise(role, true);
      }

      const resolveInherits = (inherits?: string[]) =>
        inherits
          ? Promise.all(
              inherits.map(parent =>
                can<P>({ enableLogger: false })(mappedRoles)(parent, operation, params)
              )
            )
              .then(result => resolvePromise(role, result.includes(true)))
              .catch(() => resolvePromise(role, false))
          : resolvePromise(role, false);

      const resolveResult = (result: unknown) =>
        result ? resolvePromise(role, Boolean(result)) : resolveInherits(foundedRole.inherits);

      const resolveWhen = (when: When<P> | true | undefined) => {
        if (when === true) {
          return resolvePromise(role, true);
        }
        if (isPromise(when)) {
          return (when as Promise<boolean>)
            .then(res => resolveResult(res))
            .catch(() => resolvePromise(role, false));
        }
        if (isFunction(when)) {
          return (when as Function)(params, (err: unknown, result?: boolean) => {
            if (err) return reject(err);
            return resolveResult(result);
          });
        }
        return resolvePromise(role, false);
      };

      if (regexOperation || isGlobOperation) {
        return resolvePromise(
          role,
          checkRegex(
            isGlobOperation ? globToRegex(operation as string) : (regexOperation as RegExp),
            foundedRole.can
          )
        );
      }

      if (Object.keys(foundedRole.can).some(isGlob)) {
        const matchOperation = globsFromFoundedRole(foundedRole.can).filter(x =>
          x.regex.test(String(operation))
        )[0];
        if (matchOperation) return resolveWhen(matchOperation.when);
      }

      if (!matchOperationFromCan) {
        if (!foundedRole.inherits) return resolvePromise(role, false);
        return resolveInherits(foundedRole.inherits);
      }

      return resolveWhen(matchOperationFromCan);
    });

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
    return {
      ...acc,
      [roleName]: {
        can: roleCanMap(roleValue.can),
        inherits: roleValue.inherits
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
