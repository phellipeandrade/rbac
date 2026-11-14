import { globToRegex } from '../utils/patterns';
import type { PermissionCaches } from './permission-cache';
import type { PermissionCheckContext, PermissionLogger, WhenEvaluator } from './permission-context';

const cacheAndReturn = (
  cache: Map<string, boolean>,
  key: string,
  value: boolean
): boolean => {
  cache.set(key, value);
  return value;
};

const matchesOperationName = (regex: RegExp, name: string): boolean => {
  regex.lastIndex = 0;
  return regex.test(name);
};

export const createQueryMatcher = <P>(
  getRoleCache: PermissionCaches<P>['getRoleCache'],
  log: PermissionLogger
) => async (
  { role, resolvedRole, operation, logEnabled, skipFalseLog }: PermissionCheckContext<P>,
  regexOperation: RegExp | null,
  isGlobOperation: boolean,
  evaluateWhen: WhenEvaluator<P>
): Promise<boolean> => {
  const regex = isGlobOperation
    ? globToRegex(operation as string)
    : (regexOperation as RegExp);
  const cacheKey = isGlobOperation
    ? `glob:${operation as string}`
    : `regex:${regex.toString()}`;
  const cache = getRoleCache(role);
  const cached = cache.get(cacheKey);
  if (cached !== undefined) {
    return log(role, operation, cached, logEnabled);
  }

  let sawConditionalMatch = false;

  for (const name of resolvedRole.direct) {
    if (matchesOperationName(regex, name)) {
      return log(role, operation, cacheAndReturn(cache, cacheKey, true), logEnabled);
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
      return log(role, operation, cacheAndReturn(cache, cacheKey, true), logEnabled);
    }
    sawConditionalMatch = true;
    if (await evaluateWhen(pattern.when)) return true;
  }

  if (!sawConditionalMatch) {
    return log(role, operation, cacheAndReturn(cache, cacheKey, false), logEnabled);
  }

  if (!skipFalseLog) log(role, operation, false, logEnabled);
  return false;
};
