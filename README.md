# Hierarchical Role-Based Access Control for Node.js

* LightWeight
* Blazzing Fast
* Zero dependency

## Features

* Focused on operations
* Scalable
* Each role is given specific access rights for every operation
* High granularity in assigning rights

## Getting Started


## Contributing

#### Contributions are welcome!

1. Build RBAC
  * Run `yarn install` to get the RBAC's dependencies
  * Run `yarn build` to produce minified version of RBAC.

2. Development mode
  * Having all the dependencies installed run `yarn dev`. This command will generate an non-minified version of your library and will run a watcher so you get the compilation on file change.

3. Running the tests
  * Run `yarn test` or `npm run test`

4. Scripts
* `yarn build` - produces production version of your library under the `lib` folder
* `yarn dev` - produces development version of your library and runs a watcher
* `yarn test` - well ... it runs the tests :)
* `yarn test:watch` - same as above but in a watch mode


## Thanks

  This project scaffold was built with a modified version of [webpack-library-starter](https://github.com/krasimir/webpack-library-starter)

  Thanks for Karl Düüna ([DeadAlready](https://github.com/DeadAlready)) and his awesome [post on medium](https://blog.nodeswat.com/implement-access-control-in-node-js-8567e7b484d1): 