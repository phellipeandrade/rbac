---
id: migration
title: Upgrade from RBAC 1.x
---

# Upgrade from 1.x

**1.x is deprecated.** The supported documentation is [3.x (latest)](/rbac/docs/intro/).

To upgrade an existing 1.x application, follow these guides in order:

1. [Migrate from 1.x to 2.x](/rbac/docs/migration-1-to-2/) — TypeScript declarations, new APIs and integration changes.
2. [Migrate from 2.x to 3.x](/rbac/docs/migration-2-to-3/) — Node.js requirements, package exports, conditional callbacks and adapters.

When staying temporarily on 1.x, pin the exact release and test all permission decisions. See the [1.x API snapshot](./api.md) for the legacy contract.
