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

import RBAC from '@rbac/rbac';
import { createTenantRBAC } from '@rbac/rbac';

// Test 1: Verify RBAC is imported as a function (not requiring .default)
// TypeScript should recognize this as a function that returns a function
const rbacFactory = RBAC;

// Test 2: Use RBAC with configuration
// TypeScript should infer the correct types
const config = {
  enableLogger: true,
  logger: (role: string, operation: string | RegExp, result: boolean) => {
    console.log(`Role: ${role}, Operation: ${operation}, Result: ${result}`);
  }
};

// Test 3: Call RBAC with configuration - should return a function
const rbacWithConfig = RBAC(config);

// Test 4: Define roles
const roles = {
  admin: {
    can: ['*'],
    inherits: []
  },
  user: {
    can: ['read', 'write'],
    inherits: []
  }
};

// Test 5: Create RBAC instance
// The return type is inferred from RBAC function
const rbacInstance = rbacWithConfig(roles);

// Test 6: Verify the instance has the expected methods
// TypeScript should recognize these methods exist
async function testRBACInstance() {
  // can method should be recognized
  const canRead = await rbacInstance.can('user', 'read');
  
  // updateRoles method should be recognized
  rbacInstance.updateRoles(roles);
  
  // addRole method should be recognized
  rbacInstance.addRole('guest', { can: ['read'], inherits: [] });
  
  return canRead;
}

// Test 7: Verify named export (createTenantRBAC) has correct type
// This should be recognized as an async function
const tenantRBACFactory: typeof createTenantRBAC = createTenantRBAC;

// Test 8: Type check - RBAC should be callable
type RBACType = typeof RBAC;
const testRBAC: RBACType = RBAC;

console.log('TypeScript ES module type checking passed!');
console.log('- RBAC imported as default export without .default');
console.log('- Type annotations work correctly');
console.log('- Named exports accessible with proper types');
console.log('- RBAC instance methods are properly typed');

// Export the test function to verify it compiles
export { testRBACInstance };
