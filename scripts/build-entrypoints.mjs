import { writeFile } from 'node:fs/promises';

// ESM is a thin facade over the same CommonJS module instance. This avoids the
// dual-package hazard and retains require('@rbac/rbac') as a callable function.
await writeFile('lib/index.cjs', `
const compiled = require('./index.js');
module.exports = Object.assign(compiled.default, compiled);
`);

const facades = [
  {
    file: 'lib/index.mjs',
    module: './index.cjs',
    names: ['createTenantRBAC', 'MongoRoleAdapter', 'MySQLRoleAdapter', 'PostgresRoleAdapter',
      'createExpressMiddleware', 'createNestMiddleware', 'createNestGuard', 'createFastifyMiddleware'],
    defaultExport: true
  },
  {
    file: 'lib/adapters/index.mjs',
    module: './index.js',
    names: ['MongoRoleAdapter', 'MySQLRoleAdapter', 'PostgresRoleAdapter']
  },
  {
    file: 'lib/middlewares/index.mjs',
    module: './index.js',
    names: ['createExpressMiddleware', 'createNestMiddleware', 'createNestGuard', 'createFastifyMiddleware']
  },
  {
    file: 'lib/roles.schema.mjs',
    module: './roles.schema.js',
    names: ['whenSchema', 'roleOperationSchema', 'roleSchema', 'rolesSchema']
  },
  {
    file: 'lib/helpers.mjs',
    module: './helpers.js',
    names: ['supportsColor', 'colorize', 'underline', 'defaultLogger', 'isGlob', 'regexFromOperation',
      'globToRegex', 'hasMatchingOperation', 'normalizeWhen', 'callbackWhen', 'buildPermissionData']
  }
];

for (const { file, module, names, defaultExport } of facades) {
  const lines = [`import entry from '${module}';`];
  if (defaultExport) lines.push('export default entry;');
  for (const name of names) lines.push(`export const ${name} = entry.${name};`);
  await writeFile(file, `${lines.join('\n')}\n`);
}

// NodeNext resolves ESM and CommonJS declarations independently. A .d.ts
// default export is not callable when TypeScript models its CJS namespace.
await writeFile('lib/index.d.mts', `
declare const RBAC: typeof import('./rbac.js').default;
export default RBAC;
export { createTenantRBAC } from './index.js';
export { MongoRoleAdapter, MySQLRoleAdapter, PostgresRoleAdapter } from './adapters/index.js';
export { createExpressMiddleware, createNestMiddleware, createNestGuard, createFastifyMiddleware } from './middlewares/index.js';
export type { RBACConfig, RBACInstance, Role, Roles, When, WhenCallback, WhenFunction } from './types.js';
`);

await writeFile('lib/index.d.cts', `
import type { RBACConfig, RBACInstance, Roles } from './types.js';
declare function RBAC<P>(config?: RBACConfig): (roles: Roles<P>) => RBACInstance<P>;
declare namespace RBAC {
  type RBACConfig = import('./types.js').RBACConfig;
  type RBACInstance<P = unknown> = import('./types.js').RBACInstance<P>;
  type Role<P = unknown> = import('./types.js').Role<P>;
  type Roles<P = unknown> = import('./types.js').Roles<P>;
  type When<P = unknown> = import('./types.js').When<P>;
  type WhenCallback<P = unknown> = import('./types.js').WhenCallback<P>;
  type WhenFunction<P = unknown> = import('./types.js').WhenFunction<P>;
  const createTenantRBAC: typeof import('./index.js').createTenantRBAC;
  const MongoRoleAdapter: typeof import('./adapters/index.js').MongoRoleAdapter;
  const MySQLRoleAdapter: typeof import('./adapters/index.js').MySQLRoleAdapter;
  const PostgresRoleAdapter: typeof import('./adapters/index.js').PostgresRoleAdapter;
  const createExpressMiddleware: typeof import('./middlewares/index.js').createExpressMiddleware;
  const createNestMiddleware: typeof import('./middlewares/index.js').createNestMiddleware;
  const createNestGuard: typeof import('./middlewares/index.js').createNestGuard;
  const createFastifyMiddleware: typeof import('./middlewares/index.js').createFastifyMiddleware;
}
export = RBAC;
`);
