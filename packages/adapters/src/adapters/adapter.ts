import type { Role, Roles } from '@rbac/core';

export interface RoleAdapter<P = unknown> {
  getRoles(tenantId?: string): Promise<Roles<P>>;
  addRole(roleName: string, role: Role<P>, tenantId?: string): Promise<void>;
  updateRoles(roles: Roles<P>, tenantId?: string): Promise<void>;
}
