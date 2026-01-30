const assert = require('assert');

// Test Requirement 2.2: Backward compatibility with .default accessor
// Both require('@rbac/rbac') and require('@rbac/rbac').default should work identically

console.log('Testing backward compatibility with .default accessor...');

// Import using both patterns
const RBACDirect = require('@rbac/rbac');
const RBACWithDefault = require('@rbac/rbac').default;

// Verify both are functions
assert.strictEqual(typeof RBACDirect, 'function', 'require("@rbac/rbac") should be a function');
assert.strictEqual(typeof RBACWithDefault, 'function', 'require("@rbac/rbac").default should be a function');

console.log('✅ Type check passed: Both patterns return functions');

// Verify they return the SAME function (reference equality)
assert.strictEqual(RBACDirect, RBACWithDefault, 
  'require("@rbac/rbac") and require("@rbac/rbac").default should return the same function');

console.log('✅ Identity check passed: Both patterns return the same function reference');

// Test that both patterns work identically with the same input
const roles = {
  user: {
    can: ['read']
  },
  admin: {
    can: ['read', 'write']
  }
};

const rbacInstance1 = RBACDirect({ enableLogger: false })(roles);
const rbacInstance2 = RBACWithDefault({ enableLogger: false })(roles);

assert.strictEqual(typeof rbacInstance1, 'object', 'RBACDirect() should return an object');
assert.strictEqual(typeof rbacInstance1.can, 'function', 'RBACDirect instance should have a can method');

assert.strictEqual(typeof rbacInstance2, 'object', 'RBACWithDefault() should return an object');
assert.strictEqual(typeof rbacInstance2.can, 'function', 'RBACWithDefault instance should have a can method');

console.log('✅ Functional check passed: Both patterns create valid RBAC instances');

// Test that both instances behave identically
(async () => {
  try {
    const canRead1 = await rbacInstance1.can('user', 'read');
    const canRead2 = await rbacInstance2.can('user', 'read');
    assert.strictEqual(canRead1, canRead2, 'Both instances should return same result for user read permission');
    assert.strictEqual(canRead1, true, 'User should be able to read');
    
    const canWrite1 = await rbacInstance1.can('user', 'write');
    const canWrite2 = await rbacInstance2.can('user', 'write');
    assert.strictEqual(canWrite1, canWrite2, 'Both instances should return same result for user write permission');
    assert.strictEqual(canWrite1, false, 'User should not be able to write');
    
    const canWriteAdmin1 = await rbacInstance1.can('admin', 'write');
    const canWriteAdmin2 = await rbacInstance2.can('admin', 'write');
    assert.strictEqual(canWriteAdmin1, canWriteAdmin2, 'Both instances should return same result for admin write permission');
    assert.strictEqual(canWriteAdmin1, true, 'Admin should be able to write');
    
    console.log('✅ Behavior check passed: Both patterns produce identical results');
    console.log('✅ All backward compatibility tests passed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
})();
