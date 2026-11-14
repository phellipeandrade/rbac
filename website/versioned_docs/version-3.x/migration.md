---
id: migration
title: Migrating existing RBAC integrations
---

# Migrate an existing integration

When upgrading from an older RBAC release, review both the JavaScript runtime calls and the package imports. The current package is published as `@rbac/rbac` with CommonJS and ESM entry points.

For a step-by-step upgrade from a published major release, use the dedicated guides: **[1.x → 2.x](./migration-1-to-2.md)** and **[2.x → 3.x](./migration-2-to-3.md)**. This is the archived **3.x** documentation; **4.x** is the current version.

## Changes across major versions

Version 2 introduced the TypeScript implementation, runtime role updates, MongoDB/MySQL/PostgreSQL adapters, framework middlewares, and tenant-aware authorization helpers. Version 3 requires **Node.js 22.12.0+**, moves Zod schemas to the opt-in `@rbac/rbac/schemas` and `@rbac/rbac/roles.schema` subpaths, and rejects invalid SQL table or column identifiers during adapter construction. Review these changes before upgrading older code.

## Review your usage

1. Check the [changelog](https://github.com/phellipeandrade/rbac/blob/master/CHANGELOG.md) for changes affecting your installed version.
2. Upgrade the dependency, then verify your actual `RBAC(config)(roles)` calls. The factory is curried: it first accepts optional configuration, then a role map.
3. Await `rbac.can(role, operation, params?)`. The check always returns `Promise<boolean>`.
4. Review role inheritance and all `when` predicates. Use `callbackWhen()` from `@rbac/rbac/helpers` to explicitly adapt legacy Node-style callbacks.
5. Import persistent storage adapters from `@rbac/rbac/adapters` and framework integrations from `@rbac/rbac/middlewares`; install the relevant optional database driver separately.
6. Run your own authorization regression tests for denied paths, unknown roles, tenant separation and conditional checks before deploying.

If you previously imported schema validation from the package root, change that import to `@rbac/rbac/schemas`. Keep the published CommonJS factory callable through `require('@rbac/rbac')`, and use the same API with the ESM default import.

## Example: move a callback condition to the explicit helper

```ts
import RBAC from '@rbac/rbac';
import { callbackWhen } from '@rbac/rbac/helpers';

const auth = RBAC<{ active: boolean }>()({
  member: { can: [{
    name: 'profile:edit',
    when: callbackWhen((context, done) => done(null, context.active))
  }] }
});

console.log(await auth.can('member', 'profile:edit', { active: true })); // true
```

Database adapters store role definitions, not arbitrary executable closures. Review serialized conditions before migrating from in-memory roles. The [runtime guide](./runtime.md) explains how to update an instance after loading new definitions.
