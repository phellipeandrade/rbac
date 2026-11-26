---
id: security-performance
title: Security, errors and performance
---

# Authorization in production

RBAC is **deny-by-default**: an unknown role or unmatched operation returns `false`. A rejected or throwing `when` predicate also denies that grant. However, application authorization is only as reliable as the roles, parameters, and operations it supplies.

## Trusted inputs

Derive a user's roles from a validated session or server-side identity, not request headers or body fields. Verify resource ownership and tenant scope against trusted data; do not accept a client-submitted `ownerId` as proof. Enforce `await rbac.can()` **at the protected operation**, including background jobs, write endpoints, and service methods. Authentication and role assignment remain application responsibilities.

## Failures and errors

Conditional errors deny the affected grant rather than allowing it. Middleware may propagate infrastructure errors using the framework's conventions (Express and Nest middleware call `next(err)`). Handle database and initialization errors in application code; a failed adapter read is not an authorization success. Where multiple grants match, any other successful grant can still authorize access.

## Cache behavior

- Permission and pattern matching use bounded caches for repeated lookups.
- Conditional outcomes depending on `params` are evaluated on every call and not cached.
- `addRole()`, `updateRoles()`, and `replaceRoles()` rebuild inheritance and invalidate permission matching caches.
- Shared regex patterns reset stateful `lastIndex` before checking, including global/sticky expressions.

Measure performance with your own role graph and operation distribution. The repository exposes `npm run bench`, `npm run bench:engine` and `npm run bench:micro`. See the [measured benchmark report](./benchmarks.md) for tables, Mermaid charts and reproduction steps. Scores are environment-specific, not guaranteed throughput.

## Storage and concurrency

SQL adapters bind data values and validate/quote identifiers. Choose a schema and unique keys consistent with the adapter's upsert strategy. Use a distinct tenant ID on every request.

Each RBAC instance keeps an in-memory snapshot. After a successful read of the complete role set, [apply it with `replaceRoles()`](./runtime.md#reload-the-complete-role-set) to remove grants from roles deleted in storage. Coordinate the update across the processes that serve the tenant.
