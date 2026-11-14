import { isGlob, regexFromOperation } from '../utils/patterns';
import type { NormalizedWhenFn } from '../types';

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

  return { getRoleCache, getPatternCache, getOperationHint };
};
