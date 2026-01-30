const assert = require('assert');

// Test Requirement 2.1: CommonJS consumer should be able to require RBAC directly
// without needing .default accessor
const RBAC = require('@rbac/rbac');

console.log('Testing CommonJS import without .default accessor...');

// Verify that RBAC is a function directly
assert.strictEqual(typeof RBAC, 'function', 'RBAC should be a function when imported via require()');

console.log('✅ Type check passed: RBAC is a function');

// Test that we can actually use it
const roles = {
  user: {
    can: ['read']
  },
  admin: {
    can: ['read', 'write']
  }
};

const rbacInstance = RBAC({ enableLogger: false })(roles);

assert.strictEqual(typeof rbacInstance, 'object', 'RBAC() should return an object');
assert.strictEqual(typeof rbacInstance.can, 'function', 'RBAC instance should have a can method');

console.log('✅ Functional check passed: RBAC works correctly');

// Test basic permission check
(async () => {
  try {
    const canRead = await rbacInstance.can('user', 'read');
    assert.strictEqual(canRead, true, 'User should be able to read');
    
    const canWrite = await rbacInstance.can('user', 'write');
    assert.strictEqual(canWrite, false, 'User should not be able to write');
    
    console.log('✅ Permission checks passed');
    console.log('✅ All CommonJS tests passed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
})();
