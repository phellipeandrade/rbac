type Predicate<T> = (value: any) => value is T;
export declare const isRegex: Predicate<RegExp>;
export declare const isGlob: Predicate<string>;
export declare const isPromise: Predicate<Promise<any>>;
export declare const isFunction: Predicate<Function>;
export declare const isString: Predicate<string>;
export declare const underline: () => string;
export declare const defaultLogger: (role: string, operation: string, result: boolean) => void;
export declare const validators: {
    role: (role: string) => void;
    roles: (roles: object) => void;
    operation: (operation: string | RegExp) => void;
    foundedRole: (foundedRole: any) => void;
};
export declare const regexFromOperation: (value: string | RegExp) => RegExp | null;
export declare const globToRegex: (glob: string | string[]) => RegExp;
export declare const checkRegex: (regex: RegExp, can: {
    [operation: string]: any;
}) => boolean;
export declare const globsFromFoundedRole: (can: {
    [operation: string]: any;
}) => Array<{
    role: string;
    regex: RegExp;
    when: any;
}>;
export {};
