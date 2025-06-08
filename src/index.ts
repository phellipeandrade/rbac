import RBAC from './rbac';
import type { RBACConfig, RBACInstance } from './types';
import type { RoleAdapter } from './adapters/adapter';

export async function createTenantRBAC<P>(
  adapter: RoleAdapter<P>,
  tenantId: string,
  config: RBACConfig = {}
): Promise<RBACInstance<P>> {
  const roles = await adapter.getRoles(tenantId);
  return RBAC<P>(config)(roles);
}

export * from './middlewares';
export * from './roles.schema';
export default RBAC;
