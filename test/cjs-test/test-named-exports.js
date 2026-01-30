const assert = require('assert');

// Test that named exports are accessible
const { createTenantRBAC } = require('@rbac/rbac');

console.log('Testing named exports in CommonJS...');

// Verify that createTenantRBAC is a function
assert.strictEqual(typeof createTenantRBAC, 'function', 'createTenantRBAC should be a function');

console.log('✅ Named export check passed: createTenantRBAC is accessible');

// Also verify we can get both default and named exports together
const RBAC = require('@rbac/rbac');
assert.strictEqual(typeof RBAC, 'function', 'Default export should be a function');
assert.strictEqual(typeof RBAC.createTenantRBAC, 'function', 'Named export should be accessible on default export');

console.log('✅ Combined export check passed');
console.log('✅ All named export tests passed!');
