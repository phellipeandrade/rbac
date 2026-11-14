import { defaultLogger } from '../utils/logger';
import type { MappedRoles, RBACConfig } from '../types';
import { createPermissionCaches } from './permission-cache';
import { createDirectChecker } from './permission-matcher';

export const createPermissionChecker =
  <P>(config: RBACConfig = { logger: defaultLogger, enableLogger: true }) =>
  (
    mappedRoles: MappedRoles<P>,
    matchCache: Map<string, Map<string, boolean>>
  ) => {
    const logger = config.logger || defaultLogger;

    const log = config.enableLogger
      ? (roleName: string, operation: string | RegExp, result: boolean, enabled: boolean): boolean => {
          if (enabled) logger(roleName, operation, result, config.colors);
          return result;
        }
      : (_r: string, _o: string | RegExp, result: boolean): boolean => result;

    const checkDirect = createDirectChecker(createPermissionCaches<P>(matchCache), log);

    const check = async (
      role: string,
      operation: string | RegExp,
      params?: P,
      logEnabled = true
    ): Promise<boolean> => {
      const resolvedRole = mappedRoles[role];
      if (!resolvedRole) {
        return log(role, operation, false, logEnabled);
      }
      // Exact grants are fully resolved during construction (including
      // inheritance).  Keeping this outside checkDirect avoids entering its
      // async state machine for the hot O(1) path.
      if (typeof operation === 'string' && resolvedRole.direct.has(operation)) {
        return log(role, operation, true, logEnabled);
      }
      // This is the wildcard counterpart of the exact fast path.  A literal
      // `resource:*` grant has no runtime-dependent work, so do not enter the
      // generic pattern matcher just to execute its already-known result.
      if (
        typeof operation === 'string' &&
        !resolvedRole.conditional.has(operation)
      ) {
        const separator = operation.lastIndexOf(':');
        if (
          separator !== -1 &&
          separator + 1 < operation.length &&
          operation.indexOf('/', separator + 1) === -1
        ) {
          const simplePatterns = resolvedRole.simpleGlobs.get(
            operation.slice(0, separator + 1)
          );
          if (simplePatterns) {
            for (let i = 0; i < simplePatterns.length; i += 1) {
              if (simplePatterns[i].when === true) {
                return log(role, operation, true, logEnabled);
              }
            }
          }
        }
      }
      return checkDirect(role, resolvedRole, operation, params, logEnabled);
    };

    return (role: string, operation: string | RegExp, params?: P) =>
      check(role, operation, params);
  };
