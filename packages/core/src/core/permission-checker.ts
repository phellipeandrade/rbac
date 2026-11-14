import { defaultLogger } from '../utils/logger';
import type { MappedRoles, RBACConfig } from '../types';
import { createPermissionCaches } from './permission-cache';
import { createDirectChecker } from './permission-matcher';
import { cacheGet } from '../utils/bounded-cache';

const allowed = Promise.resolve(true);
const denied = Promise.resolve(false);

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

    const caches = createPermissionCaches<P>(matchCache);
    const checkDirect = createDirectChecker(caches, log);

    // A resolved, immutable Promise can be shared safely for unconditional
    // results. Preserve per-call logging and rejected Promises for log errors.
    const settled = config.enableLogger
      ? (role: string, operation: string | RegExp, result: boolean, enabled: boolean): Promise<boolean> => {
          try {
            return Promise.resolve(log(role, operation, result, enabled));
          } catch (error) {
            return Promise.reject(error);
          }
        }
      : (_role: string, _operation: string | RegExp, result: boolean): Promise<boolean> =>
          result ? allowed : denied;

    const check = (
      role: string,
      operation: string | RegExp,
      params?: P,
      logEnabled = true
    ): Promise<boolean> => {
      const resolvedRole = mappedRoles[role];
      if (!resolvedRole) {
        return settled(role, operation, false, logEnabled);
      }
      // Exact grants are fully resolved during construction (including
      // inheritance).  Keeping this outside checkDirect avoids entering its
      // async state machine for the hot O(1) path.
      if (typeof operation === 'string' && resolvedRole.direct.has(operation)) {
        return settled(role, operation, true, logEnabled);
      }
      // This is the wildcard counterpart of the exact fast path.  A literal
      // `resource:*` grant has no runtime-dependent work, so do not enter the
      // generic pattern matcher just to execute its already-known result.
      if (
        typeof operation === 'string' &&
        operation.indexOf('*') === -1 &&
        operation.charCodeAt(0) !== 47 &&
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
                return settled(role, operation, true, logEnabled);
              }
            }
          }
        }
      }

      if (typeof operation === 'string') {
        if (!resolvedRole.conditional.has(operation)) {
          // Literal misses in a role without patterns need no matcher at all.
          // Glob and slash-regex queries still need to inspect role grants.
          if (
            resolvedRole.patterns.length === 0 &&
            operation.indexOf('*') === -1 &&
            operation.charCodeAt(0) !== 47
          ) {
            return settled(role, operation, false, logEnabled);
          }

          // The pattern cache stores match results, never the result of a
          // conditional grant. Only static true/null entries are reusable.
          if (
            resolvedRole.patterns.length > 0 &&
            operation.indexOf('*') === -1 &&
            operation.charCodeAt(0) !== 47
          ) {
            const cached = cacheGet(caches.getPatternCache(role), operation);
            if (cached === true || cached === null) {
              return settled(role, operation, cached === true, logEnabled);
            }
          }
        }
      } else if (operation instanceof RegExp) {
        // A regex query can be cached only after the generic matcher has
        // established that its outcome is independent of request parameters.
        const cached = cacheGet(caches.getRoleCache(role), `regex:${operation.toString()}`);
        if (cached !== undefined) {
          return settled(role, operation, cached, logEnabled);
        }
      }
      return checkDirect(role, resolvedRole, operation, params, logEnabled);
    };

    return (role: string, operation: string | RegExp, params?: P) =>
      check(role, operation, params);
  };
