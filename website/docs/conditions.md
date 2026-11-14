---
id: conditions
title: Conditional and asynchronous permissions
---

# Control grants with `when`

A conditional grant has the form `{name: string, when: When<P>}`. Supported `when` values include booleans, `Promise<boolean>`, synchronous predicates, asynchronous predicates, and Node-style callback functions. Prefer synchronous predicates for cheap checks and async predicates for data-dependent checks.

```ts
import RBAC from '@rbac/rbac';

interface Context { userId: string; ownerId: string; suspended: boolean }

const auth = RBAC<Context>()({
  member: { can: [{
    name: 'records:update',
    when: async ({ userId, ownerId, suspended }: Context) => !suspended && userId === ownerId
  }] }
});

console.log(await auth.can('member', 'records:update', {
  userId: '42', ownerId: '42', suspended: false
})); // true
```

## Adapting legacy callbacks

The `callbackWhen` helper explicitly wraps the Node-style callback form:

```ts
import RBAC from '@rbac/rbac';
import { callbackWhen } from '@rbac/rbac/helpers';

const auth = RBAC<{ verified: boolean }>()({
  member: { can: [{
    name: 'profile:update',
    when: callbackWhen((context, done) => done(null, context.verified))
  }] }
});

console.log(await auth.can('member', 'profile:update', { verified: true })); // true
```

Synchronous exceptions, rejected promises, and callback errors resolve to a denied grant (`false`). **The authorization engine cannot validate the provenance of `params`**: fetch or verify ownership/tenant data on the server, and do not trust a client-supplied `ownerId` as proof of ownership.

The library does not memoize conditional outcomes. A new call with different params evaluates the condition again. A `Promise<boolean>` supplied directly as `when` is a single promise reused across calls; prefer a function when the result must reflect current state.
