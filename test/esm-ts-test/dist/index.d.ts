/**
 * TypeScript ES Module Test
 *
 * This test validates that:
 * 1. RBAC can be imported as default export in TypeScript ES modules
 * 2. TypeScript correctly recognizes RBAC as a function with proper type signatures
 * 3. No type errors occur during compilation
 * 4. Named exports like createTenantRBAC are also accessible with correct types
 *
 * Validates: Requirements 1.2
 */
declare function testRBACInstance(): Promise<boolean>;
export { testRBACInstance };
