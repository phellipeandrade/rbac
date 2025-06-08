export interface RBACConfig {
  logger?: (role: string, operation: string | RegExp, result: boolean) => void;
  enableLogger?: boolean;
}

export type WhenCallback<P = unknown> = (
  params: P,
  done: (err: unknown, result?: boolean) => void
) => void;

export type When<P = unknown> = boolean | Promise<boolean> | WhenCallback<P>;

export interface GlobFromRole<P = unknown> {
  role: string;
  regex: RegExp;
  when: When<P> | true;
}

export interface Role<P = unknown> {
  can: Array<string | { name: string; when: When<P> }>;
  inherits?: string[];
}

export type Roles<P = unknown> = Record<string, Role<P>>;

export interface MappedRole<P = unknown> {
  can: Record<string, When<P> | true>;
  inherits?: string[];
  globs: GlobFromRole<P>[];
}

export type MappedRoles<P = unknown> = Record<string, MappedRole<P>>;

export interface RBACInstance<P = unknown> {
  can: (role: string, operation: string | RegExp, params?: P) => Promise<boolean>;
  updateRoles: (roles: Roles<P>) => void;
  addRole: (roleName: string, role: Role<P>) => void;
}
