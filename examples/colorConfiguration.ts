import { createRBAC } from '@rbac/core';

const roles = {
  admin: {
    can: ['user:read', 'user:write', 'user:delete']
  },
  user: {
    can: ['user:read']
  }
};

async function demonstrateColorConfiguration() {
  console.log('=== Example 1: RBAC with colors enabled ===');
  const rbacWithColors = createRBAC({ roles, enableLogger: true, colors: true });
  await rbacWithColors.can('admin', 'user:read');
  console.log('');

  console.log('=== Example 2: RBAC with colors disabled ===');
  const rbacNoColors = createRBAC({ roles, enableLogger: true, colors: false });
  await rbacNoColors.can('admin', 'user:read');
  console.log('');

  console.log('=== Example 3: RBAC with automatic color detection (default) ===');
  const rbacAuto = createRBAC({ roles, enableLogger: true });
  await rbacAuto.can('user', 'user:read');
  console.log('');

  console.log('=== Example 4: RBAC with logger disabled ===');
  const rbacNoLogger = createRBAC({ roles, enableLogger: false });
  await rbacNoLogger.can('user', 'user:read');
  console.log('(No output - logger is disabled)');
}

demonstrateColorConfiguration().catch(console.error);
