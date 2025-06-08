const assert = require('assert');
const rbac = require('@rbac/rbac').default;
const { MongoClient } = require('mongodb');

console.log('Starting remote version tests...');

// Test configuration
const testConfig = {
  roles: {
    user: {
      can: ['products:find']
    },
    admin: {
      can: ['products:find', 'products:edit', 'products:delete']
    }
  },
  mongodb: {
    uri: 'mongodb://localhost:27017',
    dbName: 'rbac_test'
  }
};

// Initialize RBAC
const rbacInstance = new rbac({
  roles: testConfig.roles,
  storage: {
    type: 'mongodb',
    options: {
      uri: testConfig.mongodb.uri,
      dbName: testConfig.mongodb.dbName
    }
  }
});

// Test cases
async function runTests() {
  try {
    // Test basic role assignment
    console.log('Testing basic role assignment...');
    const user = await rbacInstance.assignRole('user', 'user');
    assert.strictEqual(user.role, 'user');
    console.log('✅ Basic role assignment passed');

    // Test permission checking
    console.log('Testing permission checking...');
    const canFind = await rbacInstance.can('user', 'products:find');
    assert.strictEqual(canFind, true);
    const canDelete = await rbacInstance.can('user', 'products:delete');
    assert.strictEqual(canDelete, false);
    console.log('✅ Permission checking passed');

    // Test role inheritance
    console.log('Testing role inheritance...');
    await rbacInstance.assignRole('superadmin', 'admin');
    const canEdit = await rbacInstance.can('superadmin', 'products:edit');
    assert.strictEqual(canEdit, true);
    console.log('✅ Role inheritance passed');

    // Test MongoDB storage
    console.log('Testing MongoDB storage...');
    const client = await MongoClient.connect(testConfig.mongodb.uri);
    const db = client.db(testConfig.mongodb.dbName);
    const roles = await db.collection('roles').findOne({ name: 'user' });
    assert.ok(roles);
    console.log('✅ MongoDB storage passed');

    console.log('\nAll remote tests passed!');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run tests
runTests();
