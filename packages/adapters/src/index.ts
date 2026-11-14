export * from './adapters';
import { createRBAC } from '@rbac/core';
import type { RBACConfig, RBACEngine } from '@rbac/core';
import type { RoleAdapter } from './adapters/adapter';

/** Hydrate an engine using only roles belonging to the requested tenant. */
export async function createTenantRBAC<P = unknown>(
  adapter: RoleAdapter<P>, tenantId: string, options: RBACConfig = {}
): Promise<RBACEngine<P>> {
  const roles = await adapter.getRoles(tenantId);
  return createRBAC<P>({ ...options, roles });
}
