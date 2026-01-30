# CommonJS Import Test

This test project validates CommonJS import behavior for the @rbac/rbac package.

## Purpose

This test validates **Requirement 2.1**: CommonJS consumers should be able to import RBAC directly without needing `.default` accessor.

## Test Files

### index.js
The main test file that validates the expected behavior:
- Imports RBAC using CommonJS syntax: `const RBAC = require('@rbac/rbac')`
- Verifies RBAC is imported as a function directly (not an object requiring .default)
- Tests basic RBAC functionality including permissions

### test-backward-compat.js
Validates backward compatibility with the `.default` accessor pattern:
- Uses `require('@rbac/rbac').default` to access the function
- Verifies this pattern still works for existing code
- Validates **Requirement 2.2**: Backward compatibility

### test-named-exports.js
Validates that named exports are accessible in CommonJS:
- Tests destructuring: `const { createTenantRBAC } = require('@rbac/rbac')`
- Verifies named exports are accessible on the default export
- Validates **Requirement 4.1**: Named exports preservation

## Running Tests

```bash
# Install dependencies
npm install

# Run the main test
npm test

# Run backward compatibility test
node test-backward-compat.js

# Run named exports test
node test-named-exports.js

# Run all tests
npm test && node test-backward-compat.js && node test-named-exports.js
```

## Package Configuration

The package.json includes:
- No `"type"` field - Uses default CommonJS mode
- `"@rbac/rbac": "file:../../"` - Links to the local package for testing

## Implementation Details

The fix uses a CommonJS wrapper file (`lib/index.cjs`) that:
1. Imports the compiled TypeScript output (`lib/index.js`)
2. Exports the default export as the main `module.exports`
3. Preserves all named exports
4. Maintains the `.default` accessor for backward compatibility

The package.json `exports` field uses conditional exports:
```json
{
  "exports": {
    ".": {
      "require": "./lib/index.cjs",
      "import": "./lib/index.mjs"
    }
  }
}
```

This ensures CommonJS consumers get the wrapper that provides direct function access.

## Test Results

All tests pass, confirming:
- ✅ Direct require works: `require('@rbac/rbac')` returns function
- ✅ Backward compatibility: `require('@rbac/rbac').default` still works
- ✅ Named exports: `require('@rbac/rbac').createTenantRBAC` works
- ✅ Destructuring: `const { createTenantRBAC } = require('@rbac/rbac')` works
