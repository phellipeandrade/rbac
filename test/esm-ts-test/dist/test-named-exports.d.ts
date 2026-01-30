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
declare function testCreateTenantRBAC(): Promise<import("../../lib/types").RBACInstance<unknown>>;
declare function testConfigurationTypes(): Promise<{
    rbacWithLogger: import("../../lib/types").RBACInstance<unknown>;
    rbacMinimal: import("../../lib/types").RBACInstance<unknown>;
    rbacEmpty: import("../../lib/types").RBACInstance<unknown>;
}>;
declare function testTenantIsolation(): Promise<void>;
export { testCreateTenantRBAC, testConfigurationTypes, testTenantIsolation };
