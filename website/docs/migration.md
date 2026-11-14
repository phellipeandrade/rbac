---
id: migration
title: Migration overview
---

# Upgrade RBAC

The current major is **4.x**, distributed as `@rbac/core` and optional integration packages. The previous `@rbac/rbac` package uses a different factory and package layout. Follow the dedicated guide for your current version:

- [1.x → 2.x](./migration-1-to-2.md) — historical changes to TypeScript, runtime updates, and integrations.
- [2.x → 3.x](./migration-2-to-3.md) — CommonJS/ESM exports, conditional callbacks, and SQL identifier validation.
- **[3.x → 4.x](./migration-3-to-4.md)** — renamed packages, single-options factory, named exports, types, and integration migration.

Applications on 1.x or 2.x should review each intermediate guide in order. The version selector retains the historical **1.x** and **2.x** reference docs. For new applications, use the [v4 installation guide](./installation.md) and the [API reference](./api/index.md).

Upgrading authorization code requires tests for **denied and allowed paths**, conditional grants, inherited roles, regex/globs, runtime updates, and tenant isolation. The v4 guide includes a practical verification checklist.
