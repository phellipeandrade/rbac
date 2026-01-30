/**
 * ES Module Named Exports Test
 * 
 * This test validates that named exports work correctly in ES modules.
 * Specifically tests Requirement 4.1: Named exports should be accessible
 * in both CommonJS and ES modules.
 * 
 * Validates: Requirements 4.1
 */

import assert from 'assert';
import { createTenantRBAC } from '@rbac/rbac';

console.log('Testing named exports in ES modules...\n');

// Test 1: Verify createTenantRBAC is imported as a function
console.log('Test 1: Verifying createTenantRBAC import type...');
console.log('  - Type of createTenantRBAC:', typeof createTenantRBAC);
assert.strictEqual(typeof createTenantRBAC, 'function', 'createTenantRBAC should be a function');
console.log('✅ createTenantRBAC is correctly imported as a function\n');

// Test 2: Verify createTenantRBAC can be called with a mock adapter
console.log('Test 2: Verifying createTenantRBAC functionality...');

// Create a simple mock adapter for testing
const mockAdapter = {
  async getRoles(tenantId) {
    console.log(`  - Mock adapter called with tenantId: ${tenantId}`);
    // Return different roles based on tenant
    if (tenantId === 'tenant-a') {
      return {
        user: {
          can: ['products:find', 'products:view']
        },
        admin: {
          can: ['products:*']
        }
      };
    } else if (tenantId === 'tenant-b') {
      return {
        user: {
          can: ['orders:find']
        }
      };
    }
    return {};
  }
};

// Test 3: Create RBAC instance for tenant A
console.log('\nTest 3: Creating RBAC instance for tenant-a...');
const rbacTenantA = await createTenantRBAC(mockAdapter, 'tenant-a', { enableLogger: false });
assert(typeof rbacTenantA === 'object', 'createTenantRBAC should return an RBAC instance');
assert(typeof rbacTenantA.can === 'function', 'RBAC instance should have a can method');
console.log('✅ RBAC instance created successfully for tenant-a\n');

// Test 4: Verify tenant A permissions
console.log('Test 4: Verifying tenant-a permissions...');
const tenantAUserCanFind = await rbacTenantA.can('user', 'products:find');
assert.strictEqual(tenantAUserCanFind, true, 'Tenant A user should have permission to find products');
console.log('  - ✓ User can find products');

const tenantAUserCannotDelete = await rbacTenantA.can('user', 'products:delete');
assert.strictEqual(tenantAUserCannotDelete, false, 'Tenant A user should not have permission to delete products');
console.log('  - ✓ User cannot delete products');

const tenantAAdminCanDelete = await rbacTenantA.can('admin', 'products:delete');
assert.strictEqual(tenantAAdminCanDelete, true, 'Tenant A admin should have permission to delete products');
console.log('  - ✓ Admin can delete products');
console.log('✅ Tenant A permissions work correctly\n');

// Test 5: Create RBAC instance for tenant B
console.log('Test 5: Creating RBAC instance for tenant-b...');
const rbacTenantB = await createTenantRBAC(mockAdapter, 'tenant-b', { enableLogger: false });
console.log('✅ RBAC instance created successfully for tenant-b\n');

// Test 6: Verify tenant B has different permissions
console.log('Test 6: Verifying tenant-b has different permissions...');
const tenantBUserCanFindOrders = await rbacTenantB.can('user', 'orders:find');
assert.strictEqual(tenantBUserCanFindOrders, true, 'Tenant B user should have permission to find orders');
console.log('  - ✓ User can find orders');

const tenantBUserCannotFindProducts = await rbacTenantB.can('user', 'products:find');
assert.strictEqual(tenantBUserCannotFindProducts, false, 'Tenant B user should not have permission to find products');
console.log('  - ✓ User cannot find products (different tenant)');
console.log('✅ Tenant isolation works correctly\n');

// Test 7: Verify we can import both default and named exports together
console.log('Test 7: Verifying combined imports...');
import RBAC from '@rbac/rbac';
assert.strictEqual(typeof RBAC, 'function', 'Default export should be a function');
console.log('  - ✓ Default export (RBAC) is accessible');
console.log('  - ✓ Named export (createTenantRBAC) is accessible');
console.log('✅ Both default and named exports work together\n');

console.log('🎉 All named export tests passed successfully!');
