# Library Essentials (LE) Introduction

This library centers on an **operation-first** approach to authorization. Instead of tying permissions to resources, you describe the exact operations your application exposes and map roles to those operations.

## How RBAC is structured

- **Curried factory:** `RBAC(config)(roles)` returns an object with the `can`, `addRole`, and `updateRoles` helpers. Configuration accepts a custom logger and a switch to enable or disable logging.
- **Operations:** Any string can be an operation. Use exact matches, glob-style patterns (e.g., `products:*`), or regular expressions to express permissions at the granularity you need.
- **Roles:** Each role lists operations under `can` and can optionally `inherit` other roles, creating a hierarchy without repeating permissions.
- **Conditions:** Every permission can define a `when` guard as a boolean, promise, async function, or callback. The guard receives the `params` object you pass to `can` and returns a truthy or falsy value.
- **Caching:** Permission checks are cached per role to speed up repeated lookups, including glob and regex evaluations.

## What happens during a `can` check

1. Resolve the role and expand inherited permissions.
2. Try direct matches (`operation` string) first.
3. Evaluate glob or regex matches, caching results per role and pattern.
4. If the permission has a `when` guard, normalize it to an async function and evaluate it with the provided params.
5. Log the outcome when logging is enabled.

Understanding these steps makes it easier to choose between exact operations, patterns, or conditional checks for your own system.
