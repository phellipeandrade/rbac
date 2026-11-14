import type { When, WhenCallback, NormalizedWhenFn } from '../types';

export const normalizeWhen = <P>(when: When<P> | true): NormalizedWhenFn<P> | true => {
  if (when === true) return true;
  if (when === false) return async () => false;
  if (typeof when === 'function') {
    if ((when as Function).length >= 2) {
      return async (params: P) =>
        new Promise<boolean>(resolve => {
          (when as WhenCallback<P>)(params, (err, result) => {
            if (err) return resolve(false);
            resolve(Boolean(result));
          });
        });
    }
    return async (params: P) => {
      try {
        return Boolean(await (when as any)(params));
      } catch {
        return false;
      }
    };
  }
  if (when instanceof Promise) {
    return async () => {
      try {
        return Boolean(await when);
      } catch {
        return false;
      }
    };
  }
  return async () => Boolean(when);
};
