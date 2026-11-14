import type { NormalizedWhenFn } from '../types';
import { cacheGet, cacheSet, MATCH_CACHE_LIMIT } from '../utils/bounded-cache';
import type { PermissionCaches } from './permission-cache';
import type { PermissionCheckContext, PermissionLogger, WhenEvaluator } from './permission-context';

export const createLiteralMatcher = <P>(
  getPatternCache: PermissionCaches<P>['getPatternCache'],
  log: PermissionLogger
) => async (
  { role, resolvedRole, operation, logEnabled, skipFalseLog }: PermissionCheckContext<P>,
  evaluateWhen: WhenEvaluator<P>
): Promise<boolean> => {
  const operationString = typeof operation === 'string' ? operation : String(operation);

  // Index the common `resource:*` form for an exact prefix lookup.
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
          return log(role, operation, true, logEnabled);
        }
        if (await evaluateWhen(pattern.when, false)) return true;
      }
    }
  }

  const patternCache = getPatternCache(role);
  let cachedWhen = cacheGet(patternCache, operationString);
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

    cacheSet(patternCache, operationString, cachedWhen, MATCH_CACHE_LIMIT);
  }

  if (cachedWhen === true) {
    return log(role, operation, true, logEnabled);
  }

  if (cachedWhen && cachedWhen.length > 0) {
    for (const candidateWhen of cachedWhen) {
      if (await evaluateWhen(candidateWhen, false)) return true;
    }
  }

  if (!skipFalseLog) log(role, operation, false, logEnabled);
  return false;
};
