# Migrating from v1 to v2

This guide summarizes the main changes introduced in version 2 of **RBAC** and how to update your applications.

## Main changes

- **Complete rewrite in TypeScript.** The API remains compatible but the source files are now in TypeScript for better type support and public declarations.
- **Dynamic role updates.** The `updateRoles` function allows modifying permissions at runtime.
- **Database adapters.** New adapters for MongoDB, MySQL and PostgreSQL make it possible to automatically load and persist roles.
- **Official middlewares.** Middlewares for Express, NestJS and Fastify make protecting routes easier.
- **Multi-tenant support.** Use `createTenantRBAC` to instantiate isolated RBAC instances per tenant.

## Steps to update

1. Update your `package.json` dependency to `@rbac/rbac@^2.0.0` or the latest version.
2. If you use plain JavaScript, no changes are required. For TypeScript, import the types exposed by `@rbac/rbac`.
3. If you previously loaded roles manually, consider using a database adapter to centralize persistence.
4. Review your calls to `RBAC.can` and other utilities; the API is the same but `when` can now be an async function or promise.
5. For a gradual migration, keep your existing `.js` files and adopt `.ts` as needed.

For more details check the [CHANGELOG](../CHANGELOG.md).
