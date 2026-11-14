---
id: playground
title: Interactive playground
---

# Explore permission decisions

Open the [interactive RBAC playground](/playground) to experiment with role definitions, hierarchy, conditions, and operation checks. The playground calls the RBAC engine from this repository.

Start with a `reader` role that grants `posts:read`, inherit it from `editor`, and verify that `editor` can read while `reader` cannot write. Use the guides on [permissions](./roles-permissions.md) and [conditions](./conditions.md) to interpret the results.

Playground examples are demonstrations. Apply checks to trusted user identity and server-side resource context when integrating the library into your application.
