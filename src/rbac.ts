/* eslint-disable no-promise-executor-return */

import {
  checkRegex,
  defaultLogger,
  globsFromFoundedRole,
  globToRegex,
  isFunction,
  isGlob,
  isPromise,
  isString,
  regexFromOperation,
  validators,
} from './helpers';

type Operation = string;

type Params = unknown; // Replace with a more specific type if known

type DoneFunction = (error: Error | null, result: boolean) => void;

type WhenFunction = (params: Params, done: DoneFunction) => void;

type RoleCan = {
  name: string;
  when: boolean | WhenFunction | Promise<boolean>;
};

type Role = {
  can: Array<Operation | RoleCan>;
  inherits?: string[];
};

type Roles = {
  [roleName: string]: Role;
};

type LoggerFunction = (
  role: string,
  operation: string,
  result: boolean
) => void;

type Config = {
  logger?: LoggerFunction;
  enableLogger?: boolean;
};

interface IRBAC {
  can(role: string, operation: string, params?: Params): Promise<boolean>;
}

const isRoleCan = (item: Operation | RoleCan): item is RoleCan =>
  typeof item !== 'string';

const can =
  (
    config: Config = {
      logger: defaultLogger,
      enableLogger: true,
    }
  ) =>
  (mappedRoles: Roles) =>
  (role: string, operation: string, params?: Params): Promise<boolean> =>
    new Promise((resolve, reject) => {
      const foundedRole = mappedRoles[role];
      const regexOperation = regexFromOperation(operation);
      const isGlobOperation = isGlob(operation);

      validators.role(role);
      validators.operation(operation);
      validators.foundedRole(foundedRole);

      const resolvePromise = (innerRole: string, result: boolean) => {
        if (config.enableLogger && config.logger) {
          config.logger(innerRole, operation, result);
        }
        return resolve(result);
      };

      const resolveWhen = (when: boolean | WhenFunction | Promise<boolean>) => {
        if (when === true) {
          return resolvePromise(role, true);
        }
        if (isPromise(when)) {
          return when
            .then(result => resolvePromise(role, result))
            .catch(() => resolvePromise(role, false));
        }
        if (isFunction(when)) {
          return (when as WhenFunction)(
            params,
            (err: Error | null, result: boolean) => {
              if (err) return reject(err);
              return resolvePromise(role, result);
            }
          );
        }
        return resolvePromise(role, false);
      };

      if (isString(operation)) {
        const matchOperationFromCan = foundedRole?.can.find(op =>
          isRoleCan(op) ? op.name === operation : op === operation
        );

        if (matchOperationFromCan) {
          if (typeof matchOperationFromCan === 'string') {
            return resolvePromise(role, true);
          }
          if (isRoleCan(matchOperationFromCan)) {
            return resolveWhen(matchOperationFromCan.when);
          }
        }
      }

      if (regexOperation || isGlobOperation) {
        const canRecord: Record<
          string,
          boolean | WhenFunction | Promise<boolean>
        > = {};

        foundedRole?.can.forEach(item => {
          if (typeof item === 'string') {
            canRecord[item] = true;
          } else {
            canRecord[item.name] = item.when;
          }
        });

        return resolvePromise(
          role,
          checkRegex(
            isGlobOperation
              ? globToRegex(operation)
              : (regexOperation as RegExp),
            canRecord
          )
        );
      }

      if (foundedRole && Object.keys(foundedRole.can).some(isGlob)) {
        const canRecord: Record<
          string,
          boolean | WhenFunction | Promise<boolean>
        > = {};

        foundedRole.can.forEach(item => {
          if (typeof item === 'string') {
            canRecord[item] = true;
          } else {
            canRecord[item.name] = item.when;
          }
        });

        const matchOperation = globsFromFoundedRole(canRecord).find(x =>
          x.regex.test(operation)
        );

        if (matchOperation) {
          const when = matchOperation.when;

          if (
            typeof when === 'boolean' ||
            isFunction(when) ||
            isPromise(when)
          ) {
            return resolveWhen(when);
          }
        }
      }

      return foundedRole?.inherits
        ? Promise.all(
            foundedRole.inherits.map(inheritRole =>
              can({ enableLogger: false })(mappedRoles)(
                inheritRole,
                operation,
                params
              )
            )
          )
            .then(results =>
              resolvePromise(
                role,
                results.some(result => result)
              )
            )
            .catch(() => resolvePromise(role, false))
        : resolvePromise(role, false);
    });

const RBAC = (config?: Config): ((roles: Roles) => IRBAC) => {
  return (roles: Roles) => {
    validators.roles(roles);
    return {
      can: can(config)(roles),
    };
  };
};

export default RBAC;

export type {
  Config,
  DoneFunction,
  IRBAC,
  LoggerFunction,
  Operation,
  Params,
  Role,
  RoleCan,
  Roles,
  WhenFunction,
};
