import type { PermissionCheckContext, PermissionLogger, WhenEvaluator } from './permission-context';

export const createWhenEvaluator = <P>(
  { role, operation, logEnabled, skipFalseLog }: PermissionCheckContext<P>,
  params: P | undefined,
  log: PermissionLogger
): WhenEvaluator<P> => async (when, shouldLogFalse = true) => {
  if (when === true) {
    log(role, operation, true, logEnabled);
    return true;
  }
  if (!when) {
    if (shouldLogFalse && !skipFalseLog) {
      log(role, operation, false, logEnabled);
    }
    return false;
  }
  try {
    const result = await when(params as P);
    if (result) {
      log(role, operation, true, logEnabled);
    } else if (shouldLogFalse && !skipFalseLog) {
      log(role, operation, false, logEnabled);
    }
    return result;
  } catch {
    if (shouldLogFalse && !skipFalseLog) {
      log(role, operation, false, logEnabled);
    }
    return false;
  }
};
