export interface RBACConfig {
  logger?: (role: string, operation: string | RegExp, result: boolean, colorsEnabled?: boolean) => void;
  enableLogger?: boolean;
  colors?: boolean;
}

export type WhenCallback<P = unknown> = (
  params: P,
  done: (err: unknown, result?: boolean) => void
) => void;

export type WhenFunction<P = unknown> = (params: P) => boolean | Promise<boolean>;

export type When<P = unknown> =
  | boolean
  | Promise<boolean>
  | WhenCallback<P>
  | WhenFunction<P>;

export type NormalizedWhenFn<P = unknown> = (params: P) => Promise<boolean>;

export interface PatternPermission<P = unknown> {
  name: string;
  regex: RegExp;
  when: NormalizedWhenFn<P> | true;
}

export interface Role<P = unknown> {
  can: Array<string | { name: string; when: When<P> }>;
  inherits?: string[];
}

export type Roles<P = unknown> = Record<string, Role<P>>;

export interface MappedRole<P = unknown> {
  direct: Set<string>;
  conditional: Map<string, NormalizedWhenFn<P>>;
  patterns: PatternPermission<P>[];
  inherits?: string[];
  allOps: string[];
}

export type MappedRoles<P = unknown> = Record<string, MappedRole<P>>;

export interface RBACInstance<P = unknown> {
  can: (role: string, operation: string | RegExp, params?: P) => Promise<boolean>;
  updateRoles: (roles: Roles<P>) => void;
  addRole: (roleName: string, role: Role<P>) => void;
}
