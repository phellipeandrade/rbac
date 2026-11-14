import type { MappedRole, NormalizedWhenFn } from '../types';

export interface PermissionCheckContext<P> {
  role: string;
  resolvedRole: MappedRole<P>;
  operation: string | RegExp;
  logEnabled: boolean;
  skipFalseLog: boolean;
}

export type PermissionLogger = (
  role: string,
  operation: string | RegExp,
  result: boolean,
  enabled: boolean
) => boolean;

export type WhenEvaluator<P> = (
  when: NormalizedWhenFn<P> | true | undefined,
  shouldLogFalse?: boolean
) => Promise<boolean>;
