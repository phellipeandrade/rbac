import {
  defaultLogger,
  regexFromOperation,
  isGlob,
  globToRegex,
  hasMatchingOperation,
  normalizeWhen,
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

const can =
  <P>(config: RBACConfig = { logger: defaultLogger, enableLogger: true }) =>
  (mappedRoles: MappedRoles<P>) => {
    const logger = config.logger || defaultLogger;

    const log = config.enableLogger
      ? (roleName: string, operation: string | RegExp, result: boolean, enabled: boolean): boolean => {
          if (enabled) logger(roleName, operation, result);
          return result;
        }
      : (_r: string, _o: string | RegExp, result: boolean): boolean => result;

    const checkDirect = async (
      logRole: string,
      resolvedRole: MappedRole<P>,
      operation: string | RegExp,
      params?: P,
      logEnabled = true,
      skipFalseLog = false
    ): Promise<boolean> => {
      let whenFn: NormalizedWhenFn<P> | true | undefined;

      if (typeof operation === 'string') {
        if (resolvedRole.direct.has(operation)) {
          return log(logRole, operation, true, logEnabled);
        }
        whenFn = resolvedRole.conditional.get(operation);
      }

      const regexOperation = regexFromOperation(operation);
      const isGlobOperation = isGlob(operation);

      if (regexOperation || isGlobOperation) {
        const regex = isGlobOperation
          ? globToRegex(operation as string)
          : (regexOperation as RegExp);
        return log(
          logRole,
          operation,
          hasMatchingOperation(regex, resolvedRole.allOps),
          logEnabled
        );
      }

      if (!whenFn) {
        const matchPattern = resolvedRole.patterns.find(p =>
          p.regex.test(String(operation))
        );
        if (matchPattern) whenFn = matchPattern.when;
      }

      if (!whenFn) {
        if (!skipFalseLog) log(logRole, operation, false, logEnabled);
        return false;
      }

      return evaluateWhen(whenFn);

      async function evaluateWhen(when: NormalizedWhenFn<P> | true | undefined): Promise<boolean> {
        if (when === true) {
          log(logRole, operation, true, logEnabled);
          return true;
        }
        if (!when) {
          if (!skipFalseLog) log(logRole, operation, false, logEnabled);
          return false;
        }
        try {
          const res = await when(params as P);
          log(logRole, operation, res, logEnabled);
          return res;
        } catch {
          log(logRole, operation, false, logEnabled);
          return false;
        }
      }
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
      return checkDirect(role, resolvedRole, operation, params, logEnabled);
    };

    return (role: string, operation: string | RegExp, params?: P) =>
      check(role, operation, params);
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
