# Comparison

RBAC focuses on performance and flexibility while keeping the API small. This page highlights how it differs from other access-control approaches and how to measure those differences with the built-in benchmarks.

## Where this library stands out

- **Operation-oriented permissions:** Operations are plain strings that can also be matched with globs or regular expressions, enabling granular checks without designing a resource matrix.
- **Hierarchical roles:** Roles can inherit from one another to avoid duplicating permission lists.
- **Conditional guards:** Permissions can be gated by callbacks, async functions, or promises so that runtime context influences the decision.
- **Runtime mutability:** `addRole` and `updateRoles` let you change the role map without restarting your app.
- **Adapter support:** Optional MongoDB, MySQL, and PostgreSQL adapters make it straightforward to persist and share definitions across services.
- **Multi-tenant aware:** A `tenantId` can be provided to adapters and the `createTenantRBAC` helper to isolate role definitions by tenant.

## Benchmarks

The repository includes a benchmark suite that compares RBAC against popular alternatives such as `accesscontrol`, `rbac`, `easy-rbac`, and `fast-rbac` across direct checks, inherited roles, and conditional permissions.

Run the suite with:

```bash
yarn bench
```

The script builds large permission sets, executes identical operations against each library, and prints timing results to the console.

## Choosing the right model

- Pick this library when you need fast checks on string-based operations, optional glob/regex matching, and minimal setup.
- Use conditional guards when permissions depend on runtime data such as ownership or tenant membership.
- Pair the adapters with the multi-tenant helper if your platform isolates permissions per customer or workspace.
