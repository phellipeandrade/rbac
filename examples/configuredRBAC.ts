import { createRBAC } from '@rbac/core';
import type { Roles } from '@rbac/core';

export default function configuredRBAC<P = unknown>(roles: Roles<P>) {
  return createRBAC<P>({ roles, enableLogger: false });
}
