import assert from 'assert';
import RBAC from '@rbac/rbac';

// Test 1: Verify RBAC is imported as a function directly (not an object with .default)
// This test validates Requirement 1.1: ES module consumers should get the function directly
console.log('Test 1: Verifying RBAC import type...');
console.log('  - Type of RBAC:', typeof RBAC);
console.log('  - Has .default property:', RBAC?.default !== undefined);

// The requirement states: RBAC should be imported as a function directly without .default
// Currently this will fail because of the bug we're fixing
try {
  assert(typeof RBAC === 'function', 'RBAC should be imported as a function directly');
  assert(RBAC.default === undefined, 'RBAC should not have a .default property (it should be the function itself)');
  console.log('✅ RBAC is correctly imported as a function');
} catch (error) {
  console.log('❌ BUG CONFIRMED: RBAC is not imported as a function directly');
  console.log('   Current behavior: RBAC is an object with .default property');
  console.log('   Expected behavior: RBAC should be the function itself');
  throw error;
}

// Test 2: Verify RBAC can be called and returns a function
console.log('\nTest 2: Verifying RBAC can be configured...');
const configuredRBAC = RBAC({ enableLogger: false });
assert(typeof configuredRBAC === 'function', 'RBAC() should return a function');
console.log('✅ RBAC configuration works correctly');

// Test 3: Verify RBAC instance creation with roles
console.log('\nTest 3: Verifying RBAC instance creation...');
const defaultRoles = {
  user: {
    can: ['products:find']
  },
  admin: {
    can: ['products:find', 'products:edit', 'products:delete']
  }
};

const RBACInstance = configuredRBAC(defaultRoles);
assert(typeof RBACInstance === 'object', 'RBAC instance should be an object');
assert(typeof RBACInstance.can === 'function', 'RBAC instance should have a can method');
console.log('✅ RBAC instance created successfully');

// Test 4: Verify basic permissions work
console.log('\nTest 4: Verifying basic permissions...');
async function testPermissions() {
  const userCanFind = await RBACInstance.can('user', 'products:find');
  assert(userCanFind === true, 'User should have permission to find products');

  const userCannotEdit = await RBACInstance.can('user', 'products:edit');
  assert(userCannotEdit === false, 'User should not have permission to edit products');

  const adminCanEdit = await RBACInstance.can('admin', 'products:edit');
  assert(adminCanEdit === true, 'Admin should have permission to edit products');

  console.log('✅ All permission checks passed');
}

// Test 5: Verify async conditions work
console.log('\nTest 5: Verifying async conditions...');
async function testAsyncConditions() {
  const rolesWithAsync = {
    user: {
      can: [
        {
          name: 'products:edit',
          when: (params, callback) => {
            const result = params.accountId === '123';
            callback(null, result);
          }
        },
        'products:find'
      ]
    }
  };

  const RBACAsync = RBAC({ enableLogger: false })(rolesWithAsync);
  
  const canEdit = await RBACAsync.can('user', 'products:edit', { accountId: '123' });
  assert(canEdit === true, 'Should have permission when condition is true');
  
  const cannotEdit = await RBACAsync.can('user', 'products:edit', { accountId: '456' });
  assert(cannotEdit === false, 'Should not have permission when condition is false');
  
  console.log('✅ Async condition checks passed');
}

// Run all tests
(async () => {
  try {
    await testPermissions();
    await testAsyncConditions();
    console.log('\n🎉 All ES module tests passed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
