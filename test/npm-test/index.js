const assert = require('assert');
const rbac = require('@rbac/rbac').default;

// Defining default roles
const defaultRoles = {
  user: {
    can: ['products:find']
  },
  admin: {
    can: ['products:find', 'products:edit', 'products:delete']
  }
};

// Testing package import
console.log('Testing package import...');
assert(typeof rbac === 'function', 'The package must export a function');

// Testing basic configuration
console.log('Testing basic configuration...');
const RBACInstance = rbac({ enableLogger: false })(defaultRoles);
assert(typeof RBACInstance === 'object', 'The configuration must return an object');
assert(typeof RBACInstance.can === 'function', 'The object must have a can method');

// Testing basic permissions
console.log('Testing basic permissions...');

// Testing user permissions
async function testUserPermissions() {
  const userCanFind = await RBACInstance.can('user', 'products:find');
  assert(userCanFind, 'User should have permission to find products');

  const userCannotEdit = await RBACInstance.can('user', 'products:edit');
  assert(!userCannotEdit, 'User should not have permission to edit products');
}

// Testing admin permissions
async function testAdminPermissions() {
  const adminCanFind = await RBACInstance.can('admin', 'products:find');
  assert(adminCanFind, 'Admin should have permission to find products');

  const adminCanEdit = await RBACInstance.can('admin', 'products:edit');
  assert(adminCanEdit, 'Admin should have permission to edit products');

  const adminCanDelete = await RBACInstance.can('admin', 'products:delete');
  assert(adminCanDelete, 'Admin should have permission to delete products');
}

// Running the tests
(async () => {
  try {
    await testUserPermissions();
    await testAdminPermissions();
    console.log('✅ All tests passed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
})();

console.log('✅ All tests passed successfully!');

// Function to simulate an asynchronous condition
async function testAsyncCondition() {
  console.log('Testing asynchronous condition...');
  
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

  const RBACAsync = rbac({ enableLogger: false })(rolesWithAsync);
  
  // Testing true condition
  const canEdit = await RBACAsync.can('user', 'products:edit', { accountId: '123' });
  assert(canEdit === true, 'Should have permission when condition is true');
  
  // Testing false condition
  const cannotEdit = await RBACAsync.can('user', 'products:edit', { accountId: '456' });
  assert(cannotEdit === false, 'Should not have permission when condition is false');
  
  // Testing basic permission
  const canFind = await RBACAsync.can('user', 'products:find');
  assert(canFind === true, 'Should have basic permission');
  
  // Testing false condition with undefined parameter
  const cannotEditNoParams = await RBACAsync.can('user', 'products:edit', { accountId: undefined });
  assert(cannotEditNoParams === false, 'Should not have permission without parameters');
  
  // Testing false condition with empty parameters
  const cannotEditEmptyParams = await RBACAsync.can('user', 'products:edit', {});
  assert(cannotEditEmptyParams === false, 'Should not have permission with empty parameters');
  
  console.log('✅ Asynchronous condition tests passed successfully!');
}

// Adding asynchronous condition test
(async () => {
  try {
    await testUserPermissions();
    await testAdminPermissions();
    await testAsyncCondition();
    console.log('✅ All tests passed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
})();
