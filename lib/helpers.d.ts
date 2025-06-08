import type { When, GlobFromRole } from './types';
export declare const isGlob: (value: unknown) => value is string;
export declare const isPromise: <T = unknown>(value: unknown) => value is Promise<T>;
export declare const isFunction: (value: unknown) => value is Function;
export declare const isString: (value: unknown) => value is string;
export declare const underline: () => string;
export declare const defaultLogger: (role: string, operation: string | RegExp, result: boolean) => void;
export declare const validators: {
    role: (role: unknown) => void;
    roles: (roles: unknown) => void;
    operation: (operation: unknown) => void;
    foundedRole: (foundedRole: unknown) => void;
};
export declare const regexFromOperation: (value: string | RegExp) => RegExp | null;
export declare const globToRegex: (glob: string | string[]) => RegExp;
export declare const checkRegex: (regex: RegExp, can: Record<string, unknown>) => boolean;
export declare const globsFromFoundedRole: <P = unknown>(can: Record<string, When<P> | true>) => GlobFromRole<P>[];
export type { When, WhenCallback, GlobFromRole } from './types';
