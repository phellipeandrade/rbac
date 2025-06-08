const assert = require('assert');
const rbac = require('@rbac/rbac').default;
// Mock MongoDB implementation
const mockMongo = {
  connect: () => Promise.resolve({
    db: () => ({
      collection: () => ({
        insertOne: () => Promise.resolve({ insertedId: 'mock-id' }),
        findOne: () => Promise.resolve({ role: 'user' }),
        updateOne: () => Promise.resolve({ modifiedCount: 1 }),
        deleteOne: () => Promise.resolve({ deletedCount: 1 })
      })
    })
  })
};

// Mock storage implementation
const mockStorage = {
  type: 'mongodb',
  options: {
    client: mockMongo
  }
};

console.log('Starting remote version tests with mocked MongoDB...');

// Initialize RBAC with mocked storage
const rbacInstance = new rbac({
  roles: {
    user: {
      can: ['products:find']
    },
    admin: {
      can: ['products:find', 'products:edit', 'products:delete']
    }
  },
  storage: mockStorage
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
