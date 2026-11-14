---
id: conditions
title: Conditional permissions (1.x)
---

# Conditional grants with `when`

Version 1.1.0 documents Node-style callbacks and promises as conditions. A callback receives the authorization context and a `done(error, allowed)` function:

```js
const RBAC = require('@rbac/rbac');

const auth = RBAC()({
  author: {
    can: [{
      name: 'posts:edit',
      when: (context, done) => done(null, context.authorId === context.userId)
    }]
  }
});

auth.can('author', 'posts:edit', { authorId: 7, userId: 7 })
  .then(console.log); // true
```

The historical API allows a promise as a `when` value as well. Use an on-demand predicate when permissions depend on changing user or resource state. For 1.x, avoid assuming the synchronous/async predicate and explicit callback adapters documented for later versions are present.

The parameters come from your application. Verify ownership and tenant information on the server before passing it to authorization checks. For modern condition handling, follow the [migration guides](./migration.md).
