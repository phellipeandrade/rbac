import type { Role, Roles } from '../types';

export interface RoleAdapter<P = unknown> {
  getRoles(): Promise<Roles<P>>;
  addRole(roleName: string, role: Role<P>): Promise<void>;
  updateRoles(roles: Roles<P>): Promise<void>;
}
