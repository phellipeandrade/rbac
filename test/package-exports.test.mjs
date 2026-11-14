import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const cjs = require('@rbac/rbac');
const esm = await import('@rbac/rbac');
const cjsAdapters = require('@rbac/rbac/adapters');
const esmAdapters = await import('@rbac/rbac/adapters');
const cjsMiddlewares = require('@rbac/rbac/middlewares');
const esmMiddlewares = await import('@rbac/rbac/middlewares');
const helpers = await import('@rbac/rbac/helpers');

assert.equal(typeof cjs, 'function', 'CommonJS default must stay callable');
assert.strictEqual(esm.default, cjs, 'ESM and CommonJS must use one RBAC instance');
assert.strictEqual(cjs.default, cjs);
assert.strictEqual(esm.createTenantRBAC, cjs.createTenantRBAC);

for (const name of ['MongoRoleAdapter', 'MySQLRoleAdapter', 'PostgresRoleAdapter']) {
  assert.strictEqual(esm[name], cjs[name], `${name} at root`);
  assert.strictEqual(esmAdapters[name], cjs[name], `${name} at /adapters`);
  assert.strictEqual(cjsAdapters[name], cjs[name], `${name} in require(/adapters)`);
}
for (const name of ['createExpressMiddleware', 'createNestMiddleware', 'createNestGuard', 'createFastifyMiddleware']) {
  assert.strictEqual(esm[name], cjs[name], `${name} at root`);
  assert.strictEqual(esmMiddlewares[name], cjs[name], `${name} at /middlewares`);
  assert.strictEqual(cjsMiddlewares[name], cjs[name], `${name} in require(/middlewares)`);
}
assert.equal(typeof helpers.callbackWhen, 'function');
assert.equal(typeof helpers.normalizeWhen, 'function');

// The main entrypoints should not eagerly import Zod.
assert.equal(Object.keys(require.cache).some(path => /[/\\]node_modules[/\\]zod[/\\]/.test(path)), false);
const cjsSchemas = require('@rbac/rbac/schemas');
const esmSchemas = await import('@rbac/rbac/roles.schema');
assert.strictEqual(cjsSchemas.roleSchema, esmSchemas.roleSchema);
assert.equal(typeof cjsSchemas.rolesSchema.parse, 'function');
assert.equal(require('@rbac/rbac/package.json').name, '@rbac/rbac');

const access = esm.default({ enableLogger: false })({ editor: { can: ['documents:read'] } });
assert.equal(await access.can('editor', 'documents:read'), true);
assert.equal(await access.can('editor', 'documents:delete'), false);
console.log('Package entrypoints, ESM/CJS identity, schemas and lazy Zod: OK');
