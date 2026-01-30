import assert from 'assert';
import RBACModule from '@rbac/rbac';

// Workaround test: Using .default to access the function
// This demonstrates that the functionality works, but requires the workaround
console.log('Workaround Test: Using .default accessor...');

const RBAC = RBACModule.default;
assert(typeof RBAC === 'function', 'RBAC.default should be a function');
console.log('✅ RBAC.default is a function');

// Test that it works functionally
const defaultRoles = {
  user: {
    can: ['products:find']
  },
  admin: {
    can: ['products:find', 'products:edit', 'products:delete']
  }
};

const RBACInstance = RBAC({ enableLogger: false })(defaultRoles);
assert(typeof RBACInstance === 'object', 'RBAC instance should be an object');
assert(typeof RBACInstance.can === 'function', 'RBAC instance should have a can method');

async function testPermissions() {
  const userCanFind = await RBACInstance.can('user', 'products:find');
  assert(userCanFind === true, 'User should have permission to find products');
  console.log('✅ Permissions work correctly with .default accessor');
}

await testPermissions();
console.log('\n✅ Workaround test passed - functionality works with .default accessor');
