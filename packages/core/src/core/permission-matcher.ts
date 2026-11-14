import type { MappedRole } from '../types';
import type { PermissionCaches } from './permission-cache';
import type { PermissionCheckContext, PermissionLogger } from './permission-context';
import { createLiteralMatcher } from './literal-matcher';
import { createQueryMatcher } from './query-matcher';
import { createWhenEvaluator } from './when-evaluator';

export const createDirectChecker = <P>(
  { getRoleCache, getPatternCache, getOperationHint }: PermissionCaches<P>,
  log: PermissionLogger
) => {
  const matchQuery = createQueryMatcher<P>(getRoleCache, log);
  const matchLiteral = createLiteralMatcher<P>(getPatternCache, log);

  return (
    role: string,
    resolvedRole: MappedRole<P>,
    operation: string | RegExp,
    params?: P,
    logEnabled = true,
    skipFalseLog = false
  ): Promise<boolean> => {
    if (typeof operation === 'string' && resolvedRole.direct.has(operation)) {
      try {
        return Promise.resolve(log(role, operation, true, logEnabled));
      } catch (error) {
        return Promise.reject(error);
      }
    }

    const whenFn = typeof operation === 'string'
      ? resolvedRole.conditional.get(operation)
      : undefined;

    const context: PermissionCheckContext<P> = {
      role, resolvedRole, operation, logEnabled, skipFalseLog
    };
    const evaluateWhen = createWhenEvaluator(context, params, log);

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
      return matchQuery(context, regexOperation, isGlobOperation, evaluateWhen);
    }

    // Exact conditional permissions take priority over patterns.
    if (whenFn) return evaluateWhen(whenFn);
    return matchLiteral(context, evaluateWhen);
  };
};
