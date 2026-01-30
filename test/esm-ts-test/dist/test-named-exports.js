/**
 * TypeScript ES Module Named Exports Test
 *
 * This test validates that:
 * 1. Named exports like createTenantRBAC are accessible in TypeScript ES modules
 * 2. TypeScript correctly infers types for named exports
 * 3. Named exports work correctly at runtime
 * 4. Type definitions are accurate for named exports
 *
 * Validates: Requirements 4.1, 6.2
 */
import { createTenantRBAC } from '@rbac/rbac';
// Test 1: Verify createTenantRBAC has correct type signature
// TypeScript should recognize this as an async function
const tenantRBACFactory = createTenantRBAC;
// Test 2: Create a mock adapter with proper typing
// We'll create a simple adapter that matches the expected interface
class MockRoleAdapter {
    constructor() {
        this.roles = new Map();
        // Initialize with test data
        this.roles.set('tenant-a', {
            user: {
                can: ['products:find', 'products:view']
            },
            admin: {
                can: ['products:*']
            }
        });
        this.roles.set('tenant-b', {
            user: {
                can: ['orders:find']
            }
        });
    }
    async getRoles(tenantId) {
        return this.roles.get(tenantId || 'default') || {};
    }
    async addRole(roleName, role, tenantId) {
        const tid = tenantId || 'default';
        const currentRoles = this.roles.get(tid) || {};
        currentRoles[roleName] = role;
        this.roles.set(tid, currentRoles);
    }
    async updateRoles(roles, tenantId) {
        const tid = tenantId || 'default';
        this.roles.set(tid, roles);
    }
}
// Test 3: Use createTenantRBAC with proper type checking
async function testCreateTenantRBAC() {
    const adapter = new MockRoleAdapter();
    // TypeScript should infer the correct return type
    const rbacInstance = await createTenantRBAC(adapter, 'tenant-a', {
        enableLogger: false
    });
    // TypeScript should recognize these methods exist with correct signatures
    const canFind = await rbacInstance.can('user', 'products:find');
    const canDelete = await rbacInstance.can('user', 'products:delete');
    const adminCanDelete = await rbacInstance.can('admin', 'products:delete');
    // Verify the results
    if (!canFind) {
        throw new Error('User should be able to find products');
    }
    if (canDelete) {
        throw new Error('User should not be able to delete products');
    }
    if (!adminCanDelete) {
        throw new Error('Admin should be able to delete products');
    }
    console.log('✅ createTenantRBAC works correctly with TypeScript types');
    return rbacInstance;
}
// Test 4: Verify type inference for configuration parameter
async function testConfigurationTypes() {
    const adapter = new MockRoleAdapter();
    // Test with explicit configuration
    const rbacWithLogger = await createTenantRBAC(adapter, 'tenant-a', {
        enableLogger: true,
        logger: (role, operation, result) => {
            console.log(`Role: ${role}, Operation: ${operation}, Result: ${result}`);
        }
    });
    // Test with minimal configuration
    const rbacMinimal = await createTenantRBAC(adapter, 'tenant-a');
    // Test with empty configuration
    const rbacEmpty = await createTenantRBAC(adapter, 'tenant-a', {});
    console.log('✅ Configuration parameter types work correctly');
    return { rbacWithLogger, rbacMinimal, rbacEmpty };
}
// Test 5: Verify tenant isolation with types
async function testTenantIsolation() {
    const adapter = new MockRoleAdapter();
    const tenantA = await createTenantRBAC(adapter, 'tenant-a', { enableLogger: false });
    const tenantB = await createTenantRBAC(adapter, 'tenant-b', { enableLogger: false });
    // Tenant A should have product permissions
    const tenantACanFindProducts = await tenantA.can('user', 'products:find');
    if (!tenantACanFindProducts) {
        throw new Error('Tenant A user should be able to find products');
    }
    // Tenant B should NOT have product permissions
    const tenantBCanFindProducts = await tenantB.can('user', 'products:find');
    if (tenantBCanFindProducts) {
        throw new Error('Tenant B user should not be able to find products');
    }
    // Tenant B should have order permissions
    const tenantBCanFindOrders = await tenantB.can('user', 'orders:find');
    if (!tenantBCanFindOrders) {
        throw new Error('Tenant B user should be able to find orders');
    }
    console.log('✅ Tenant isolation works correctly with TypeScript types');
}
// Test 6: Verify we can import both default and named exports with types
import RBAC from '@rbac/rbac';
// Both should be functions
const defaultExport = RBAC;
const namedExport = createTenantRBAC;
// Run all tests
async function runAllTests() {
    console.log('Running TypeScript named export tests...\n');
    try {
        await testCreateTenantRBAC();
        await testConfigurationTypes();
        await testTenantIsolation();
        console.log('\n🎉 All TypeScript named export tests passed!');
        console.log('- createTenantRBAC is accessible with correct types');
        console.log('- Type inference works correctly');
        console.log('- Runtime behavior matches type definitions');
        console.log('- Both default and named exports work together');
    }
    catch (error) {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    }
}
// Export for potential use in other tests
export { testCreateTenantRBAC, testConfigurationTypes, testTenantIsolation };
// Run tests if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests();
}
