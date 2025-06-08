
<p align="center">
  <img alt="RBAC" width="556px" src="img/logo.png" />
</p>

<h1 align="center">
  Hierarchical Role-Based Access Control for Node.js
</h1>

[![CircleCI](https://circleci.com/gh/phellipeandrade/rbac/tree/master.svg?style=svg)](https://circleci.com/gh/phellipeandrade/rbac/tree/master)
[![npm version](https://badge.fury.io/js/%40rbac%2Frbac.svg)](https://badge.fury.io/js/%40rbac%2Frbac) 
[![size](https://img.badgesize.io/https://raw.githubusercontent.com/phellipeandrade/rbac/master/lib/%40rbac/rbac.js.svg)](https://img.badgesize.io/https://raw.githubusercontent.com/phellipeandrade/rbac/master/lib/%40rbac/rbac.js.svg)
[![Tweet](https://img.shields.io/twitter/url/http/shields.io.svg?style=social)](https://twitter.com/intent/tweet?text=checkout%20RBAC%20project%20on%20Github!&url=https://github.com/phellipeandrade/rbac&hashtags=rbac,authorization,privacy,security,permission)


* ⏱ Lightweight
* 🔥 Blazing Fast
* ⚡️️ Zero dependency

## Features

* Focused on operations
* Scalable
* Each role is given specific access rights for every operation
* High granularity in assigning rights

## Thanks

  This project scaffold was initially based on [webpack-library-starter](https://github.com/krasimir/webpack-library-starter) and now uses **Vite** to generate the bundled output

  Thanks to Karl Düüna ([DeadAlready](https://github.com/DeadAlready)) and his awesome [post on medium](https://blog.nodeswat.com/implement-access-control-in-node-js-8567e7b484d1)
  
  
## Getting Started

#### Install

`yarn add @rbac/rbac` or `npm install @rbac/rbac`

This library is written in TypeScript and the published package ships with
its declaration files for a great developer experience.


RBAC is a curried function thats initially takes an object with configurations, 
then returns another function that takes an object with roles, 
finally returns an object that holds "can" property that is a function.

You can use it in many ways, below is one of them:

#### Setup RBAC config
![step 01](./img/01.png)

| Property     	| Type          	| Params                                                      	| Default       	| Description                             	|
|--------------	|---------------	|-------------------------------------------------------------	|---------------	|-----------------------------------------	|
| logger       	| **Function**  	| role: **String**<br/>operation: **String**<br/>result: **Boolean** 	| defaultLogger 	| Function that logs operations to console 	|
| enableLogger 	| **Boolean**   	|                                                             	| true          	| Enable or disable logger                	|

#### Creating some roles
![step 02](./img/002.png)

RBAC expects an object with roles as property names.

| Property 	| Type         	| Example                                        	| Description                                                                                                                                                                  	|
|----------	|--------------	|------------------------------------------------	|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------	|
| can      	| **Array**    	            | ```['products:*']```                        	| Array of strings, list of operations that user can do, Since v2.0.0 it also supports glob patterns                                                                                            |
| when     	| **Function or Promise**  	| ```(params , done ) =>  done (null , true )``` 	| **Optional** Promise that should resolve in Truthy or Falsy or  Callback function that receives params and done as properties, should return done passing errors, and result 	|
| inherits 	| **Array**    	            | ```['user']```                                 	| **Optional** Array of strings, list of roles inherited by this role                                                                                                               	|

###### IMPORTANT! **"when"** property should be either a Callback function that receives params and done or a Promise that should resolve in [Truthy](https://developer.mozilla.org/en-US/docs/Glossary/Truthy) or [Falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy) values. Example: 

```ts
import type { Roles } from '@rbac/rbac';

interface Params {
  registered: boolean;
}

const roles: Roles<Params> = {
  supervisor: {
    can: [{ name: 'products:find', when: (params, done) => {
      // done receives error as first argument and Truthy or Falsy value as second argument
      done(null, params.registered);
    }}]
  },
  admin: {
    can: [{ name: 'products:*', when: new Promise((resolve) => {
      resolve(true);
    }) }]
  }
};

```

#### Check if user can do some operation
![step 03](./img/03.png)

| Param  	| Type        	                                 | Example                  	| Description                                                    	|
|--------	|----------------------------------------------- |--------------------------	|----------------------------------------------------------------	|
| First  	| **String**  	                                 | ```'admin'```            	| Array of strings, list of operations that user can do          	|
| Second 	| **String**, **Glob (Wildcard)**, **Regex**     | ```'products:find'```    	| Operation to validate                                          	|
| Third  	| **Any**     	                                 | ```{registered: true}``` 	| **Optional** Params that will flow to "when" callback Function 	|
### Update roles at runtime

RBAC exposes two helpers to modify the role definition at runtime. `addRole` adds a new role and `updateRoles` merges new definitions with the existing ones.

```ts
import RBAC from '@rbac/rbac'

const base = RBAC({ enableLogger: false })({
  user: { can: ['products:find'] }
})

base.addRole('editor', { can: ['products:update'], inherits: ['user'] })
await base.can('editor', 'products:update') // true

base.updateRoles({
  user: { can: ['products:find', 'products:create'] }
})
await base.can('user', 'products:create') // true
```

### Database adapters

RBAC exposes optional adapters to load and persist role definitions using
MongoDB, MySQL or PostgreSQL. Each adapter implements the `RoleAdapter`
interface with `getRoles`, `addRole` and `updateRoles` methods.

```ts
import RBAC from '@rbac/rbac'
import { MongoRoleAdapter } from '@rbac/rbac/adapters'

const adapter = new MongoRoleAdapter({
  uri: 'mongodb://localhost:27017',
  dbName: 'mydb',
  collection: 'roles'
})

const roles = await adapter.getRoles()
const rbac = RBAC()(roles)
```

Adapters available:

- `MongoRoleAdapter`
- `MySQLRoleAdapter`
- `PostgresRoleAdapter`

Want more? Check out the [examples](examples/) folder.

## Roadmap

- [X] Wildcard support
- [X] Regex support
- [X] Update roles in runtime

## v2.0.0

- Rewritten in TypeScript
- Internal refactor focused on readability and performance
- Added support to update roles at runtime

## Contributing

#### Contributions are welcome!

1. Build RBAC
  * Run `npm install` (or `yarn install`) to get RBAC's dependencies
  * Run `npm run build` to compile the library and produce the minified bundle using Vite

2. Development mode
  * Having all the dependencies installed run `yarn dev`. This command will generate a non-minified version of your library and will run a watcher so you get the compilation on file change.

3. Running the tests
  * Run `yarn test` 

4. Scripts
* `npm run build` - produces production version of your library under the `lib` folder and generates `lib/@rbac/rbac.min.js` via Vite
* `npm run dev` - produces development version of your library and runs a watcher
* `npm test` - well ... it runs the tests :)
* `npm run test:watch` - same as above but in a watch mode

## License

This project is under MIT License [https://opensource.org/licenses/MIT]
