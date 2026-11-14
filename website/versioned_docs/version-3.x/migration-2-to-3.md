---
id: migration-2-to-3
title: Migration guide — 2.x to 3.x
---

# Migrate from RBAC 2.x to 3.x

This guide compares the final **2.2.3** release with the **3.x** line. See the [2.x historical reference](/rbac/docs/2.x/intro/) and [3.x installation guide](./installation.md) for their respective APIs.

## 1. Update Node.js and install

Version 3 requires **Node.js 22.12.0 or later**. Check the deployment, CI and local development runtimes before changing the package.

```bash
node --version
npm install @rbac/rbac@^3
```

The `RBAC(config)(roles)` factory, inherited roles and `Promise<boolean>` checks remain. Run tests against real authorization inputs before releasing.

## 2. Use the explicit package exports

2.2.3 published only the package root in its `exports` map. Version 3 provides dedicated, supported subpaths:

| Task | 2.2.3 | 3.x |
| --- | --- | --- |
| Core factory | `@rbac/rbac` | `@rbac/rbac` |
| Database adapters | Internal `lib/adapters` files; no supported exported subpath | `@rbac/rbac/adapters` |
| Framework middleware | Named exports from package root | `@rbac/rbac/middlewares` |
| Schema validation | Re-exported from package root | `@rbac/rbac/schemas` or `/roles.schema` |
| Callback helper | No exported helper subpath | `@rbac/rbac/helpers` |

```ts
import RBAC from '@rbac/rbac';
import { callbackWhen } from '@rbac/rbac/helpers';
import { createExpressMiddleware } from '@rbac/rbac/middlewares';
```

For CommonJS, `require('@rbac/rbac')` remains callable. The 3.x package has distinct ESM and CommonJS entry points that share the same underlying module instance. Update import paths in your application and verify them with your compiler and bundler.

## 3. Review conditional predicates

The 2.x declared API accepted Node-style `when(params, done)` callbacks. In 3.x, **prefer wrapping callbacks** with `callbackWhen()` from the helpers subpath instead of depending on callback inference:

```ts
import RBAC from '@rbac/rbac';
import { callbackWhen } from '@rbac/rbac/helpers';

const auth = RBAC<{ active: boolean }>()({
  member: {
    can: [{
      name: 'profile:update',
      when: callbackWhen((params, done) => done(null, params.active))
    }]
  }
});

console.log(await auth.can('member', 'profile:update', { active: true })); // true
```

In 3.x, plain sync/async predicate functions, booleans and promises are supported as well. Check that your application handles rejected conditions as denial; never cache authorization results derived from request-specific parameters.

## 4. Update adapters and schema imports

Database drivers are optional in 3.x. Install only what your application needs (`mongodb`, `mysql2` or `pg`). The SQL adapters validate and quote table/column identifiers; invalid or dynamically assembled identifier names can now be rejected. Review custom `columns` and schema-qualified table names before deployment.

The root import no longer eagerly loads Zod. Import validation schemas from `@rbac/rbac/schemas` (or `@rbac/rbac/roles.schema`) instead. Review [adapters](./adapters.md), [middleware](./middlewares.md) and [security](./security-performance.md) for supported 3.x behavior.

## 5. Validate compatibility before release

Test denied operations, unknown roles, inheritance, wildcard/regular-expression matching, dynamic `addRole()`/`updateRoles()`, async conditions, middleware failures and tenant isolation. If your application uses TypeScript, compile both ESM and CommonJS consumers where relevant. See the [migration overview](./migration.md) for a final checklist.
