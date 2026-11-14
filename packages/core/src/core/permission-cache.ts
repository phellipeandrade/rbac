import { isGlob, regexFromOperation } from '../utils/patterns';
import type { NormalizedWhenFn } from '../types';
import { cacheGet, cacheSet, OPERATION_CACHE_LIMIT, ROLE_CACHE_LIMIT } from '../utils/bounded-cache';

export type PatternMatchCacheValue<P> = NormalizedWhenFn<P>[] | true | null;

export interface PermissionCaches<P> {
  getRoleCache(roleName: string): Map<string, boolean>;
  getPatternCache(roleName: string): Map<string, PatternMatchCacheValue<P>>;
  getOperationHint(operation: string): { regex: RegExp | null; isGlob: boolean };
}

export const createPermissionCaches = <P>(
  matchCache: Map<string, Map<string, boolean>>
): PermissionCaches<P> => {
  const patternMatchCache = new Map<
    string,
    Map<string, PatternMatchCacheValue<P>>
  >();
  const operationHintCache = new Map<
    string,
    { regex: RegExp | null; isGlob: boolean }
  >();

  const getRoleCache = (roleName: string): Map<string, boolean> => {
    let cached = cacheGet(matchCache, roleName);
    if (!cached) {
      cached = new Map<string, boolean>();
      cacheSet(matchCache, roleName, cached, ROLE_CACHE_LIMIT);
    }
    return cached;
  };

  const getPatternCache = (
    roleName: string
  ): Map<string, PatternMatchCacheValue<P>> => {
    let cached = cacheGet(patternMatchCache, roleName);
    if (!cached) {
      cached = new Map<string, PatternMatchCacheValue<P>>();
      cacheSet(patternMatchCache, roleName, cached, ROLE_CACHE_LIMIT);
    }
    return cached;
  };

  const getOperationHint = (
    op: string
  ): { regex: RegExp | null; isGlob: boolean } => {
    let hint = cacheGet(operationHintCache, op);
    if (hint) return hint;
    const regex = regexFromOperation(op);
    const isGlobOperation = !regex ? isGlob(op) : false;
    hint = { regex, isGlob: isGlobOperation };
    cacheSet(operationHintCache, op, hint, OPERATION_CACHE_LIMIT);
    return hint;
  };

  return { getRoleCache, getPatternCache, getOperationHint };
};
