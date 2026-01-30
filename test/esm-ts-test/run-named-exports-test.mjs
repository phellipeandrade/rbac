/**
 * Runner script for named exports test
 */

import { testCreateTenantRBAC, testConfigurationTypes, testTenantIsolation } from './dist/test-named-exports.js';

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
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

runAllTests();
