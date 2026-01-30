import RBAC from '../src/rbac';

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
  const rbacWithColors = RBAC({ enableLogger: true, colors: true })(roles);
  await rbacWithColors.can('admin', 'user:read');
  console.log('');

  console.log('=== Example 2: RBAC with colors disabled ===');
  const rbacNoColors = RBAC({ enableLogger: true, colors: false })(roles);
  await rbacNoColors.can('admin', 'user:read');
  console.log('');

  console.log('=== Example 3: RBAC with automatic color detection (default) ===');
  const rbacAuto = RBAC({ enableLogger: true })(roles);
  await rbacAuto.can('user', 'user:read');
  console.log('');

  console.log('=== Example 4: RBAC with logger disabled ===');
  const rbacNoLogger = RBAC({ enableLogger: false })(roles);
  await rbacNoLogger.can('user', 'user:read');
  console.log('(No output - logger is disabled)');
}

demonstrateColorConfiguration().catch(console.error);
