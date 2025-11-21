# Get Started

Follow this guide to install the library, define your first role map, and perform permission checks.

## 1) Install the package

```bash
npm install @rbac/rbac
# or
yarn add @rbac/rbac
```

The package ships with TypeScript types and works in JavaScript and TypeScript projects.

## 2) Create a role map

`RBAC` is a curried factory. First pass configuration, then the role definitions:

```ts
import RBAC from '@rbac/rbac';

const rbac = RBAC({ enableLogger: false })({
  reader: { can: ['articles:find'] },
  editor: { can: ['articles:update'], inherits: ['reader'] },
  admin: { can: ['articles:*'] }
});
```

- `can` is an array of operation strings or objects with a `when` guard.
- `inherits` lets a role reuse permissions from other roles.

## 3) Check permissions

Use the `can` function returned by the factory to verify operations. Operations accept strings, glob-style wildcards, or regular expressions:

```ts
await rbac.can('reader', 'articles:find'); // true
await rbac.can('editor', 'articles:find'); // true via inheritance
await rbac.can('editor', 'articles:delete'); // false
await rbac.can('admin', /articles:/); // true through regex
```

## 4) Add conditions

Attach synchronous, asynchronous, Promise-based, or callback guards to permissions to enforce contextual rules:

```ts
interface Params {
  ownerId: string;
  currentUserId: string;
}

const rbac = RBAC()({
  author: {
    can: [{
      name: 'articles:update',
      when: ({ ownerId, currentUserId }) => ownerId === currentUserId
    }]
  }
});

await rbac.can('author', 'articles:update', {
  ownerId: '123',
  currentUserId: '123'
}); // true
```

## 5) Keep iterating

Roles can evolve at runtime without rebuilding your application:

```ts
rbac.addRole('support', { can: ['tickets:find'] });
rbac.updateRoles({
  reader: { can: ['articles:find', 'articles:share'] }
});
```

Head to **Basic Usage** for more end-to-end examples that include adapters and web framework middleware.
