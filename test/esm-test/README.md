# ES Module Import Test

This test project validates ES module import behavior for the @rbac/rbac package.

## Purpose

This test validates **Requirement 1.1**: ES module consumers should be able to import RBAC directly without needing `.default` accessor.

## Test Files

### index.js
The main test file that validates the expected behavior:
- Imports RBAC using ES module syntax: `import RBAC from '@rbac/rbac'`
- Verifies RBAC is imported as a function directly (not an object with .default)
- Tests basic RBAC functionality including permissions and async conditions

**Current Status**: This test currently FAILS because the bug hasn't been fixed yet. The test demonstrates that:
- Current behavior: RBAC is imported as an object with a `.default` property
- Expected behavior: RBAC should be imported as the function itself

### workaround-test.js
Demonstrates that the functionality works when using the `.default` accessor:
- Uses `RBACModule.default` to access the function
- Verifies all functionality works correctly with this workaround
- This is the current pattern users must use (which we want to fix)

### debug.js
A diagnostic script that shows what's actually being imported:
- Displays the type of the imported RBAC
- Shows all properties and keys
- Helps understand the current import behavior

## Running Tests

```bash
# Install dependencies
npm install

# Run the main test (currently fails - expected until fix is implemented)
npm test

# Run the workaround test (passes - shows current working pattern)
node workaround-test.js

# Run the debug script (shows import details)
node debug.js
```

## Package Configuration

The package.json includes:
- `"type": "module"` - Enables ES module mode
- `"@rbac/rbac": "file:../../"` - Links to the local package for testing

## Expected Outcome After Fix

Once the ES module import fix is implemented, the main test (index.js) should pass, demonstrating that:
1. `import RBAC from '@rbac/rbac'` provides the function directly
2. No `.default` accessor is needed
3. TypeScript types work correctly
4. All functionality works as expected
