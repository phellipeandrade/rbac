---
id: migration-1-to-2
title: Migration guide — 1.x to 2.x
---

# Migrate from RBAC 1.x to 2.x

The final releases are **1.1.0** and **2.2.3** respectively. Both major series are deprecated; for an active application, continue with the [2.x → 3.x guide](./migration-2-to-3.md) after this migration. Use the [1.x documentation](/rbac/docs/1.x/intro/) and [2.x documentation](/rbac/docs/2.x/intro/) to compare historical behavior.

## 1. Start from a known legacy baseline

```bash
npm install @rbac/rbac@1.1.0 --save-exact
```

Record representative `can()` decisions, including missing roles, inherited access, wildcard operations and callback-based conditions. Check which minor of 1.x is currently deployed: glob matching appears in the 1.1.0 documentation and may not be available in 1.0.x.

## 2. Upgrade to the last 2.x release

```bash
npm install @rbac/rbac@2.2.3 --save-exact
```

Version 1.x publishes a JavaScript bundle without TypeScript declarations. Version 2.x publishes a TypeScript implementation, declarations and an export map pointing `import` and `require` to its CommonJS entry. The curried factory and promise-based `can()` checks remain available:

```ts
import RBAC from '@rbac/rbac';

const auth = RBAC<{ verified: boolean }>()({
  member: { can: [{ name: 'posts:publish', when: ({ verified }: { verified: boolean }) => verified }] }
});

console.log(await auth.can('member', 'posts:publish', { verified: true }));
```

If your project is still JavaScript/CommonJS, keep `require('@rbac/rbac')` and your `RBAC(config)(roles)` structure; TypeScript conversion is optional.

## 3. Review new APIs and old assumptions

2.2.3 introduces `addRole()` and `updateRoles()`, `createTenantRBAC()`, framework middleware factories, adapter implementations and validation schemas. Use the [2.x API reference](/rbac/docs/2.x/api/) to see what is actually exported. In particular, the **2.2.3 published export map contains only `"."`**, so a deep import such as `@rbac/rbac/lib/adapters` is not a reliable public import. Do not assume the 3.x dedicated subpaths work on 2.x.

Both releases document callbacks and promise-based permission conditions, but the implementation and permitted forms evolved. Test each conditional rule with both true and false inputs. Always `await` an authorization result, and validate role and resource context on the server.

## 4. Continue to the supported major

Install the maintained line and follow the [2.x → 3.x migration guide](./migration-2-to-3.md) to adjust Node.js, exports, optional dependencies, schema imports and conditional callbacks.

```bash
npm install @rbac/rbac@^3
```

Run your application's permission regression suite before deploying. Focus on denial behavior, hierarchy updates, repeated conditional patterns and tenant isolation.
