# TypeScript ES Module Test

This test project validates that the @rbac/rbac package works correctly with TypeScript ES modules.

## Purpose

Validates **Requirement 1.2**: TypeScript compiler recognizes RBAC imports with correct type signatures in ES module projects.

## Test Configuration

- **Module System**: ES modules (`"type": "module"` in package.json)
- **TypeScript Module**: ES2020 (`"module": "ES2020"` in tsconfig.json)
- **Target**: ES2020
- **Strict Mode**: Enabled

## What This Test Validates

1. ✅ RBAC can be imported as default export without requiring `.default`
2. ✅ TypeScript correctly recognizes RBAC as a function with proper type signatures
3. ✅ No type errors occur during compilation
4. ✅ Named exports like `createTenantRBAC` are accessible with correct types
5. ✅ RBAC instance methods (`can`, `updateRoles`, `addRole`) are properly typed
6. ✅ TypeScript compilation produces valid ES module output

## Running the Test

```bash
# Type check only (no output files)
npm run test

# Full compilation (generates dist/ directory)
npm run build
```

## Expected Results

- `npm run test` should exit with code 0 (no type errors)
- `npm run build` should generate ES module JavaScript in `dist/` directory
- The compiled output should use `import` statements (not `require`)

## Test Coverage

This test covers:
- Default import: `import RBAC from '@rbac/rbac'`
- Named import: `import { createTenantRBAC } from '@rbac/rbac'`
- Type inference for RBAC configuration
- Type inference for RBAC instance methods
- Proper typing without requiring `.default` accessor
