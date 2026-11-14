import type { When, WhenCallback, NormalizedWhenFn } from '../types';

/** Explicitly adapt a Node-style callback predicate to an async predicate. */
export const callbackWhen = <P>(callback: WhenCallback<P>): NormalizedWhenFn<P> =>
  params => new Promise(resolve => {
    try {
      callback(params, (err, result) => resolve(!err && Boolean(result)));
    } catch {
      resolve(false);
    }
  });

export const normalizeWhen = <P>(when: When<P> | true): NormalizedWhenFn<P> | true => {
  if (when === true) return true;
  if (when === false) return async () => false;
  if (typeof when === 'function') {
    // Supports both explicit callbackWhen() and legacy callback predicates
    // without relying on Function.length (which breaks with bound/default args).
    return params => new Promise<boolean>(resolve => {
      try {
        const fn = when as (params: P, done: (err: unknown, result?: boolean) => void) =>
          boolean | Promise<boolean> | void;
        const returned = fn(params, (err, result) => resolve(!err && Boolean(result)));
        if (returned !== undefined) {
          Promise.resolve(returned).then(result => resolve(Boolean(result)), () => resolve(false));
        }
      } catch {
        resolve(false);
      }
    });
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
