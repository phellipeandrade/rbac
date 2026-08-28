import {
  defaultLogger,
  regexFromOperation,
  isGlob,
  globToRegex,
  buildPermissionData
} from './helpers';
import type {
  When,
  PatternPermission,
  NormalizedWhenFn,
  RBACConfig,
  Role,
  Roles,
  MappedRole,
  MappedRoles
} from './types';

export type { RBACConfig, Role, Roles } from './types';

type PatternMatchCacheValue<P> = NormalizedWhenFn<P>[] | true | null;

const cacheAndReturn = (
  cache: Map<string, boolean>,
  key: string,
  value: boolean
): boolean => {
  cache.set(key, value);
  return value;
};

const can =
  <P>(config: RBACConfig = { logger: defaultLogger, enableLogger: true }) =>
  (
    mappedRoles: MappedRoles<P>,
    matchCache: Map<string, Map<string, boolean>>
  ) => {
    const logger = config.logger || defaultLogger;

    const patternMatchCache = new Map<
      string,
      Map<string, PatternMatchCacheValue<P>>
    >();
    const operationHintCache = new Map<
      string,
      { regex: RegExp | null; isGlob: boolean }
    >();

    const log = config.enableLogger
      ? (roleName: string, operation: string | RegExp, result: boolean, enabled: boolean): boolean => {
          if (enabled) logger(roleName, operation, result, config.colors);
          return result;
        }
      : (_r: string, _o: string | RegExp, result: boolean): boolean => result;

    const getRoleCache = (roleName: string): Map<string, boolean> => {
      let cached = matchCache.get(roleName);
      if (!cached) {
        cached = new Map<string, boolean>();
        matchCache.set(roleName, cached);
      }
      return cached;
    };

    const getPatternCache = (
      roleName: string
    ): Map<string, PatternMatchCacheValue<P>> => {
      let cached = patternMatchCache.get(roleName);
      if (!cached) {
        cached = new Map<string, PatternMatchCacheValue<P>>();
        patternMatchCache.set(roleName, cached);
      }
      return cached;
    };

    const getOperationHint = (
      op: string
    ): { regex: RegExp | null; isGlob: boolean } => {
      let hint = operationHintCache.get(op);
      if (hint) return hint;
      const regex = regexFromOperation(op);
      const isGlobOperation = !regex ? isGlob(op) : false;
      hint = { regex, isGlob: isGlobOperation };
      operationHintCache.set(op, hint);
      return hint;
    };

    const checkDirect = async (
      logRole: string,
      resolvedRole: MappedRole<P>,
      operation: string | RegExp,
      params?: P,
      logEnabled = true,
      skipFalseLog = false
    ): Promise<boolean> => {
      let whenFn: NormalizedWhenFn<P> | true | undefined;

      const matchesOperationName = (regex: RegExp, name: string): boolean => {
        regex.lastIndex = 0;
        return regex.test(name);
      };

      const evaluateWhen = async (
        when: NormalizedWhenFn<P> | true | undefined,
        shouldLogFalse = true
      ): Promise<boolean> => {
        if (when === true) {
          log(logRole, operation, true, logEnabled);
          return true;
        }
        if (!when) {
          if (shouldLogFalse && !skipFalseLog) {
            log(logRole, operation, false, logEnabled);
          }
          return false;
        }
        try {
          const res = await when(params as P);
          if (res) {
            log(logRole, operation, true, logEnabled);
          } else if (shouldLogFalse && !skipFalseLog) {
            log(logRole, operation, false, logEnabled);
          }
          return res;
        } catch {
          if (shouldLogFalse && !skipFalseLog) {
            log(logRole, operation, false, logEnabled);
          }
          return false;
        }
      };

      if (typeof operation === 'string') {
        if (resolvedRole.direct.has(operation)) {
          return log(logRole, operation, true, logEnabled);
        }
        whenFn = resolvedRole.conditional.get(operation);
      }

      let regexOperation: RegExp | null = null;
      let isGlobOperation = false;

      if (operation instanceof RegExp) {
        regexOperation = operation;
      } else if (typeof operation === 'string') {
        const hint = getOperationHint(operation);
        regexOperation = hint.regex;
        isGlobOperation = hint.isGlob;
      }

      if (regexOperation || isGlobOperation) {
        const regex = isGlobOperation
          ? globToRegex(operation as string)
          : (regexOperation as RegExp);
        const cacheKey = isGlobOperation
          ? `glob:${operation as string}`
          : `regex:${regex.toString()}`;
        const cache = getRoleCache(logRole);
        const cached = cache.get(cacheKey);
        if (cached !== undefined) {
          return log(logRole, operation, cached, logEnabled);
        }

        let sawConditionalMatch = false;

        for (const name of resolvedRole.direct) {
          if (matchesOperationName(regex, name)) {
            return log(
              logRole,
              operation,
              cacheAndReturn(cache, cacheKey, true),
              logEnabled
            );
          }
        }

        for (const [name, conditionalWhen] of resolvedRole.conditional) {
          if (!matchesOperationName(regex, name)) continue;
          sawConditionalMatch = true;
          if (await evaluateWhen(conditionalWhen)) return true;
        }

        for (const pattern of resolvedRole.patterns) {
          if (!matchesOperationName(regex, pattern.name)) continue;
          if (pattern.when === true) {
            return log(
              logRole,
              operation,
              cacheAndReturn(cache, cacheKey, true),
              logEnabled
            );
          }
          sawConditionalMatch = true;
          if (await evaluateWhen(pattern.when)) return true;
        }

        if (!sawConditionalMatch) {
          return log(
            logRole,
            operation,
            cacheAndReturn(cache, cacheKey, false),
            logEnabled
          );
        }

        if (!skipFalseLog) log(logRole, operation, false, logEnabled);
        return false;
      }

      if (!whenFn) {
        const operationString =
          typeof operation === 'string' ? operation : String(operation);
        // The overwhelmingly common wildcard form is `resource:*`.  It is
        // resolved by an exact Map lookup instead of scanning every pattern.
        // Keep conditional exact permissions authoritative, matching the
        // existing control flow below.
        const separator = operationString.lastIndexOf(':');
        if (separator !== -1) {
          const prefix = operationString.slice(0, separator + 1);
          const simplePatterns = resolvedRole.simpleGlobs.get(prefix);
          if (
            simplePatterns &&
            operationString.length > prefix.length &&
            operationString.indexOf('/', prefix.length) === -1
          ) {
            for (let i = 0; i < simplePatterns.length; i += 1) {
              const pattern = simplePatterns[i];
              if (pattern.when === true) {
                return log(logRole, operation, true, logEnabled);
              }
              if (await evaluateWhen(pattern.when, false)) return true;
            }
          }
        }

        const patternCache = getPatternCache(logRole);
        let cachedWhen = patternCache.get(operationString);
        if (cachedWhen === undefined) {
          const matches: NormalizedWhenFn<P>[] = [];
          cachedWhen = null;

          for (const pattern of resolvedRole.patterns) {
            pattern.regex.lastIndex = 0;
            if (!pattern.regex.test(operationString)) continue;

            if (pattern.when === true) {
              cachedWhen = true;
              break;
            }

            matches.push(pattern.when);
          }

          if (cachedWhen !== true && matches.length > 0) {
            cachedWhen = matches;
          }

          patternCache.set(operationString, cachedWhen);
        }

        if (cachedWhen === true) {
          return log(logRole, operation, true, logEnabled);
        }

        if (cachedWhen && cachedWhen.length > 0) {
          for (const candidateWhen of cachedWhen) {
            if (await evaluateWhen(candidateWhen, false)) return true;
          }
          if (!skipFalseLog) log(logRole, operation, false, logEnabled);
          return false;
        }
      }

      if (!whenFn) {
        if (!skipFalseLog) log(logRole, operation, false, logEnabled);
        return false;
      }

      return evaluateWhen(whenFn);
    };

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

const indexSimpleGlobs = <P>(
  patterns: PatternPermission<P>[]
): Map<string, PatternPermission<P>[]> => {
  const index = new Map<string, PatternPermission<P>[]>();
  for (let i = 0; i < patterns.length; i += 1) {
    const pattern = patterns[i];
    const name = pattern.name;
    // A single final star after a colon is equivalent to a direct lookup by
    // resource prefix.  Other glob forms keep their regular-expression
    // semantics in the generic fallback.
    if (
      name.endsWith('*') &&
      name.indexOf('*') === name.length - 1 &&
      name.charCodeAt(name.length - 2) === 58
    ) {
      const prefix = name.slice(0, -1);
      const existing = index.get(prefix);
      if (existing) existing.push(pattern);
      else index.set(prefix, [pattern]);
    }
  }
  return index;
};

const flattenRoles = <P>(roles: Roles<P>): MappedRoles<P> => {
  const memo: MappedRoles<P> = {};
  const visit = (name: string, stack: Set<string>): MappedRole<P> => {
    if (memo[name]) return memo[name];
    if (stack.has(name))
      return {
        direct: new Set(),
        conditional: new Map(),
        patterns: [],
        simpleGlobs: new Map(),
        allOps: []
      } as MappedRole<P>;
    stack.add(name);
    const role = roles[name];
    let direct = new Set<string>();
    let conditional = new Map<string, NormalizedWhenFn<P>>();
    let patterns: PatternPermission<P>[] = [];
    let inherits: string[] | undefined;
    let all: string[] = [];
    if (role) {
      if (role.inherits) {
        inherits = role.inherits;
        for (const parent of role.inherits) {
          const parentRole = visit(parent, stack);
          for (const op of parentRole.direct) direct.add(op);
          for (const [k, v] of parentRole.conditional) conditional.set(k, v);
          patterns.push(...parentRole.patterns);
          all = Array.from(new Set(all.concat(parentRole.allOps)));
        }
      }
      const built = buildPermissionData(role.can);
      for (const op of built.direct) direct.add(op);
      for (const [k, v] of built.conditional) conditional.set(k, v);
      patterns.push(...built.patterns);
      all = Array.from(new Set(all.concat(built.all)));
    }
    stack.delete(name);
    const seen = new Set<string>();
    const unique: PatternPermission<P>[] = [];
    for (const p of patterns) {
      const key = p.name + p.regex.source;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(p);
      }
    }
    const mapped: MappedRole<P> = {
      direct,
      conditional,
      patterns: unique,
      simpleGlobs: indexSimpleGlobs(unique),
      inherits,
      allOps: Array.from(new Set([...direct, ...conditional.keys(), ...unique.map(p => p.name)]))
    };
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
    const matchCache = new Map<string, Map<string, boolean>>();
    const checker = can<P>(config);
    let checkPermission = checker(mappedRoles, matchCache);

    const canFn = (
      role: string,
      operation: string | RegExp,
      params?: P
    ) => checkPermission(role, operation, params);

    const updateRoles = (newRoles: Roles<P>): void => {
      allRoles = { ...allRoles, ...newRoles };
      mappedRoles = flattenRoles(allRoles);
      matchCache.clear();
      checkPermission = checker(mappedRoles, matchCache);
    };

    const addRole = (roleName: string, roleDef: Role<P>): void => {
      allRoles = { ...allRoles, [roleName]: roleDef };
      mappedRoles = flattenRoles(allRoles);
      matchCache.clear();
      checkPermission = checker(mappedRoles, matchCache);
    };

    return {
      can: canFn,
      updateRoles,
      addRole
    };
  };

export default RBAC;
