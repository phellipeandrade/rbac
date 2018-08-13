
<p align="center">
  <img alt="RBAC" width="556px" src="img/logo.png" />
</p>

<h1 align="center">
  Hierarchical Role-Based Access Control for Node.js
</h1>

[![CircleCI](https://circleci.com/gh/phellipeandrade/rbac/tree/master.svg?style=svg)](https://circleci.com/gh/phellipeandrade/rbac/tree/master)

* ⏱ LightWeight
* 🔥 Blazzing Fast
* ⚡️️  Zero dependency

## Features

* Focused on operations
* Scalable
* Each role is given specific access rights for every operation
* High granularity in assigning rights

## Getting Started

#### Install 

`yarn add @rbac/rbac` or `npm install @rbac/rbac`


RBAC is a curried function thats initially takes an object with configurations, 
then returns another function that takes an object with roles, 
finally returns an object that holds "can" property that is a function.

You can use it by many ways, below are one of them:

#### Setup RBAC config
![step 01](./img/01.png)

| Property     	| Type          	| Params                                                      	| Default       	| Description                             	|
|--------------	|---------------	|-------------------------------------------------------------	|---------------	|-----------------------------------------	|
| logger       	| **Function**  	| role: **String**<br/>operation: **String**<br/>result: **Boolean** 	| defaultLogger 	| Function that log operations to console 	|
| enableLogger 	| **Boolean**   	|                                                             	| true          	| Enable or disable logger                	|

#### Creating some roles
![step 02](./img/002.png)

RBAC expect an object with roles as properties names.

| Property 	| Type         	| Example                                        	| Description                                                                                                                                                                  	|
|----------	|--------------	|------------------------------------------------	|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------	|
| can      	| **Array**    	| ```['products:list']```                        	| Array of strings, list of operations that user can do                                                                                                                        	|
| when     	| **Boolean**  	| ```(params , done ) =>  done (null , true )``` 	| **Optional** Promise that should resolve in Truthy or Falsy or  Callback function that receives params and done as properties, should return done passing errors, and result 	|
| inherits 	| **Array**    	| ```['user']```                                 	| **Optional** Array of strings, list of roles inherited by this role                                                                                                               	|

###### IMPORTANT! **"when"** property should be either a Callback function that receives params and done or a Promise that should resolve in [Truthy](https://developer.mozilla.org/en-US/docs/Glossary/Truthy) or [Falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy) values. Example: 

``` javascript 

const roles = {
  supervisor: {
    can: [{ name: 'products:find', when: (params, done) => {
      // done receives error as first argument and Truthy or Falsy value as second argument
      done(error, false)
    } }]
  },
  admin: {
    can: [{name: 'products:delete', when: new Promise((resolve) => {
      resolve(true);
    })
  }]
  }
};

```

#### Check if user can do some operation
![step 03](./img/03.png)

| Param  	| Type        	| Example                  	| Description                                                    	|
|--------	|-------------	|--------------------------	|----------------------------------------------------------------	|
| First  	| **String**  	| ```'admin'```            	| Array of strings, list of operations that user can do          	|
| Second 	| **String**  	| ```'products:find'```    	| Operation to validate                                          	|
| third  	| **Any**     	| ```{registered: true}``` 	| **Optional** Params that will flow to "when" callback Function 	|

want more? checkout [examples](examples/index.js) folder.

## Roadmap

- [ ] Wildcard support
- [ ] Regex support
- [ ] Update roles in runtime

## Contributing

#### Contributions are welcome!

1. Build RBAC
  * Run `yarn install` to get the RBAC's dependencies
  * Run `yarn build` to produce minified version of RBAC.

2. Development mode
  * Having all the dependencies installed run `yarn dev`. This command will generate an non-minified version of your library and will run a watcher so you get the compilation on file change.

3. Running the tests
  * Run `yarn test` 

4. Scripts
* `yarn build` - produces production version of your library under the `lib` folder
* `yarn dev` - produces development version of your library and runs a watcher
* `yarn test` - well ... it runs the tests :)
* `yarn test:watch` - same as above but in a watch mode

## License

This project is under MIT License [https://opensource.org/licenses/MIT]

## Thanks

  This project scaffold was built with a modified version of [webpack-library-starter](https://github.com/krasimir/webpack-library-starter)

  Thanks to Karl Düüna ([DeadAlready](https://github.com/DeadAlready)) and his awesome [post on medium](https://blog.nodeswat.com/implement-access-control-in-node-js-8567e7b484d1)
