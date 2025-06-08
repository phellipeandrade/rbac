import type { When } from './helpers';
export interface RBACConfig {
    logger?: (role: string, operation: string | RegExp, result: boolean) => void;
    enableLogger?: boolean;
}
export interface Role<P = unknown> {
    can: Array<string | {
        name: string;
        when: When<P>;
    }>;
    inherits?: string[];
}
export type Roles<P = unknown> = Record<string, Role<P>>;
declare const RBAC: <P>(config?: RBACConfig) => (roles: Roles<P>) => {
    can: (role: string, operation: string | RegExp, params?: P | undefined) => Promise<boolean>;
};
export default RBAC;
