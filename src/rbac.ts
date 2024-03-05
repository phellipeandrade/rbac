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
} from './helpers';

interface OperationDefinition {
  name: string;
  when:
    | boolean
    | ((
        params?: any,
        callback?: (err: Error | null, result: boolean) => void
      ) => void)
    | Promise<boolean>;
}

interface RoleDefinition {
  can: {
    [operation: string]:
      | boolean
      | ((
          params?: any,
          callback?: (err: Error | null, result: boolean) => void
        ) => void)
      | Promise<boolean>;
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

const can =
  (
    config: Config = {
      logger: defaultLogger,
      enableLogger: true,
    }
  ) =>
  (mappedRoles: Roles) =>
  (role: string, operation: string, params?: any): Promise<boolean> =>
    new Promise((resolve, reject) => {
      const foundedRole = mappedRoles[role];
      const regexOperation = regexFromOperation(operation);
      const isGlobOperation = isGlob(operation);
      const matchOperationFromCan = foundedRole?.can[operation];

      validators.role(role);
      validators.operation(operation);
      validators.foundedRole(foundedRole);

      const resolvePromise = (role: string, result: boolean) => {
        if (config.enableLogger)
          (config.logger || defaultLogger)(role, operation, result);
        return resolve(result);
      };

      if (isString(operation) && matchOperationFromCan === true) {
        return resolvePromise(role, true);
      }

      const resolveInherits = (inherits?: string[]) =>
        inherits
          ? Promise.all(
              inherits.map(parent =>
                can({ enableLogger: false })(mappedRoles)(
                  parent,
                  operation,
                  params
                )
              )
            )
              .then(result => resolvePromise(role, result.includes(true)))
              .catch(() => resolvePromise(role, false))
          : resolvePromise(role, false);

      const resolveResult = (result: boolean) =>
        result
          ? resolvePromise(role, Boolean(result))
          : resolveInherits(foundedRole.inherits);

      const resolveWhen = (
        when:
          | boolean
          | ((
              params?: any,
              callback?: (err: Error | null, result: boolean) => void
            ) => void)
          | Promise<boolean>
      ) => {
        if (when === true) {
          return resolvePromise(role, true);
        }
        if (isPromise(when)) {
          return when
            .then(result => resolveResult(result))
            .catch(() => resolvePromise(role, false));
        }
        if (isFunction(when)) {
          return when(params, (err, result) => {
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
            isGlobOperation
              ? globToRegex(operation)
              : (regexOperation as RegExp),
            foundedRole.can
          )
        );
      }

      if (Object.keys(foundedRole.can).some(isGlob)) {
        const matchOperation = globsFromFoundedRole(foundedRole.can).find(x =>
          x.regex.test(operation)
        );
        if (matchOperation) return resolveWhen(matchOperation.when);
      }

      if (!matchOperationFromCan) {
        if (!foundedRole.inherits) return resolvePromise(role, false);
        return resolveInherits(foundedRole.inherits);
      }

      return resolveWhen(matchOperationFromCan);
    });

const roleCanMap = (roleCan: {
  [operation: string]:
    | boolean
    | ((
        params?: any,
        callback?: (err: Error | null, result: boolean) => void
      ) => void)
    | Promise<boolean>;
}): OperationDefinition[] => {
  return Object.entries(roleCan).map(([name, when]): OperationDefinition => {
    return { name, when };
  });
};

const mapRoles = (roles: Roles): { [roleName: string]: RoleDefinition } => {
  validators.roles(roles);
  return Object.entries(roles).reduce(
    (acc, [roleName, roleValue]) => ({
      ...acc,
      [roleName]: {
        can: roleCanMap(roleValue.can),
        inherits: roleValue.inherits,
      },
    }),
    {}
  );
};

const RBAC =
  (config: Config) =>
  (
    roles: Roles
  ): {
    can: (role: string, operation: string, params?: any) => Promise<boolean>;
  } => ({
    can: can(config)(mapRoles(roles)),
  });

export default RBAC;
