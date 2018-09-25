`./configuredRBAC.js`:

```javascript
import rbac from '@rbac/rbac';

const rbacConfig = {
  enableLogger: false
};

export const configuredRBAC = rbac(rbacConfig);
```

`./RBAC.js`:

```javascript
import configuredRBAC from './configuredRBAC';

const roles = {
  user: {
    can: ['products:find']
  },
  supervisor: {
    can: [{name: 'products:find', when: PromiseThatReturnsTruthyOrFalsyValue }],
    inherits: ['user']
  },
  admin: {
    can: [{name: 'products:delete', when: FunctionThatReturnsTruthyOrFalsyValue }],
    inherits: ['supervisor']
  },
  superadmin: {
    can: ['products:find', 'products:edit', 'products:delete']
  }
};

export const RBAC = configuredRBAC(roles);
```

`./example.js`:

```javascript
import RBAC from './RBAC';

const myUser = {
  name: 'John Doe',
  role: 'user',
  registered: false
}

// Async / Await style
const result = await RBAC.can(myUser.role, 'products:find', myUser.registered);

// Promise style
RBAC.can(myUser.role, 'products:find')
 .then(result => {
   doSomething(result);
 })
 .catch(error => {
   somethingWentWrong();
 });
```
