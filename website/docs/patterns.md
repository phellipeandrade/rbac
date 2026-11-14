---
id: patterns
title: Wildcards and regular expressions
---

# Match groups of operations

Use **exact strings** for simple grants. When multiple operations share a namespace, use a glob such as `posts:*`. `*` matches a non-slash segment; `**` supports deeper paths. Pattern matching is anchored to the full operation.

```ts
import RBAC from '@rbac/rbac';

const auth = RBAC()({
  staff: { can: ['posts:*', 'files/**'] }
});

console.log(await auth.can('staff', 'posts:create')); // true
console.log(await auth.can('staff', 'posts:remove')); // true
console.log(await auth.can('staff', 'users:create')); // false
```

Slash-delimited strings (`'/^reports:(read|export)$/'`) represent regex permission patterns. Plain strings are **literal** operation names unless they contain a glob wildcard. The `can()` operation argument also accepts `RegExp` for querying matching grants.

```ts
import RBAC from '@rbac/rbac';

const reports = RBAC()({ analyst: { can: ['reports:read', 'reports:export'] } });
console.log(await reports.can('analyst', /^reports:read$/)); // true
```

Keep operation names deterministic and avoid overbroad wildcards. Regular expressions with `g`/`y` flags are reset for repeatable checks. Pattern conversion is cached within bounded limits; conditions still run for every request. See [security and performance](./security-performance.md).
