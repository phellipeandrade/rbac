// Types and Interfaces
interface Permission {
  name: string;
  when?:
    | Promise<boolean>
    | ((
        params: unknown,
        callback: (err: Error | null, result: boolean) => void
      ) => void);
}

interface Role {
  can: Array<string | Permission>;
  inherits?: string[];
}

export type Roles = Record<string, Role>;

interface Config {
  logger: (role: string, operation: string | RegExp, result: boolean) => void;
  enableLogger: boolean;
}

// Utility functions for pattern matching
const isString = (value: unknown): value is string => typeof value === 'string';
const isPromise = (value: unknown): value is Promise<boolean> =>
  value instanceof Promise;
const isFunction = (
  value: unknown
): value is (
  params: unknown,
  callback: (err: Error | null, result: boolean) => void
) => void => typeof value === 'function';
const isGlob = (value: unknown): value is string =>
  isString(value) && value.includes('*');

function globToRegex(pattern: string): RegExp {
  const regex = pattern.replace(/\*/g, '.*');
  return new RegExp(`^${regex}$`);
}

function regexFromOperation(operation: string | RegExp): RegExp {
  return operation instanceof RegExp ? operation : new RegExp(operation);
}

// Validators
const validators = {
  role: (role: string): void => {
    if (!isString(role)) {
      throw new Error(`Expected a string for role, but got ${typeof role}`);
    }
  },
  operation: (operation: string | RegExp): void => {
    if (!isString(operation) && !(operation instanceof RegExp)) {
      throw new Error(
        `Expected a string or regex for operation, but got ${typeof operation}`
      );
    }
  },
  foundedRole: (role: Role | undefined): void => {
    if (!role) {
      throw new Error(`Role not found`);
    }
  },
  roles: (roles: Roles): void => {
    if (typeof roles !== 'object') {
      throw new Error(`Expected an object for roles, but got ${typeof roles}`);
    }
  },
};

// Logger
const defaultLogger = (
  role: string,
  operation: string | RegExp,
  result: boolean
): void => {
  console.log(`Role: ${role}, Operation: ${operation}, Result: ${result}`);
};

// Helper functions
const checkRegex = (
  regex: RegExp,
  can: Array<string | Permission>
): boolean => {
  return can.some(operation =>
    typeof operation === 'string'
      ? regex.test(operation)
      : regex.test(operation.name)
  );
};

const globsFromFoundedRole = (can: Array<string | Permission>) => {
  return can
    .map(
      operation =>
        isGlob(typeof operation === 'string' ? operation : operation.name) && {
          role: typeof operation === 'string' ? operation : operation.name,
          regex: globToRegex(
            typeof operation === 'string' ? operation : operation.name
          ),
          when: typeof operation === 'string' ? undefined : operation.when,
        }
    )
    .filter(Boolean) as {
    role: string;
    regex: RegExp;
    when?: Permission['when'];
  }[];
};

// Main RBAC function
const can =
  (config: Config) =>
  (
    mappedRoles: Record<
      string,
      { can: Array<string | Permission>; inherits?: string[] }
    >
  ) =>
  async (
    role: string,
    operation: string | RegExp,
    params?: unknown
  ): Promise<boolean> => {
    return new Promise<boolean>(resolve => {
      const foundedRole = mappedRoles[role];
      const regexOperation = regexFromOperation(operation);
      const isGlobOperation = isGlob(operation);
      const matchOperationFromCan = foundedRole.can.find(op =>
        typeof op === 'string' ? op === operation : op.name === operation
      );

      validators.role(role);
      validators.operation(operation);
      validators.foundedRole(foundedRole);

      const resolvePromise = (role: string, result: boolean): boolean => {
        if (config.enableLogger)
          (config.logger || defaultLogger)(role, operation, result);
        resolve(result);
        return result;
      };

      if (isString(operation) && matchOperationFromCan) {
        return resolvePromise(role, true);
      }

      const resolveInherits = (inherits?: string[]): Promise<boolean> => {
        if (inherits) {
          return Promise.all(
            inherits.map(parent =>
              can({ logger: config.logger, enableLogger: false })(mappedRoles)(
                parent,
                operation,
                params
              )
            )
          )
            .then(result => resolvePromise(role, result.includes(true)))
            .catch(() => resolvePromise(role, false));
        }
        return Promise.resolve(false);
      };

      const resolveResult = (result: boolean): Promise<boolean> => {
        if (result) return Promise.resolve(result);
        return resolveInherits(foundedRole.inherits);
      };

      const resolveWhen = (when: Permission['when']): Promise<boolean> => {
        if (typeof when === 'boolean' && when === true) {
          return Promise.resolve(true);
        }
        if (isPromise(when)) {
          return when
            .then(result => resolveResult(result))
            .catch(() => resolvePromise(role, false));
        }
        if (isFunction(when)) {
          return new Promise<boolean>(
            (resolveWhenFunction, rejectWhenFunction) => {
              when(params, (err, result) => {
                if (err) return rejectWhenFunction(err);
                resolveWhenFunction(result);
              });
            }
          ).then(result => resolveResult(result));
        }
        return Promise.resolve(false);
      };

      if (regexOperation || isGlobOperation) {
        return resolvePromise(
          role,
          checkRegex(
            isGlobOperation ? globToRegex(operation as string) : regexOperation,
            foundedRole.can
          )
        );
      }

      if (foundedRole.can.some(isGlob)) {
        const matchOperation = globsFromFoundedRole(foundedRole.can).filter(x =>
          x.regex.test(operation.toString())
        )[0];
        if (matchOperation) return resolveWhen(matchOperation.when);
      }

      if (!matchOperationFromCan) {
        if (!foundedRole.inherits) return resolvePromise(role, false);
        return resolveInherits(foundedRole.inherits);
      }

      return resolveWhen(matchOperationFromCan as Permission['when']);
    });
  };

const roleCanMap = (
  roleCan: Array<string | Permission>
): Array<string | Permission> => {
  return roleCan.map(operation =>
    typeof operation === 'string' ? operation : operation
  );
};

const mapRoles = (
  roles: Roles
): Record<string, { can: Array<string | Permission>; inherits?: string[] }> => {
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
  (config: Partial<Config> = {}) =>
  (roles: Roles) => {
    const fullConfig: Config = {
      logger: config.logger || defaultLogger,
      enableLogger:
        config.enableLogger !== undefined ? config.enableLogger : true,
    };
    return { can: can(fullConfig)(mapRoles(roles)) };
  };

export default RBAC;
