import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const coreCjs = require('@rbac/core');
const coreEsm = await import('@rbac/core');
assert.strictEqual(coreEsm.createRBAC, coreCjs.createRBAC, 'ESM/CJS share core implementation');
assert.equal(coreEsm.default, undefined, 'v4 named exports only');
assert.deepEqual(Object.keys(require('@rbac/core/package.json').dependencies ?? {}), [], 'core has zero runtime dependencies');
assert.equal(Object.keys(require.cache).some(path => /[/\\]node_modules[/\\]zod[/\\]/.test(path)), false);
const names = {
  adapters: ['createTenantRBAC', 'MongoRoleAdapter', 'MySQLRoleAdapter', 'PostgresRoleAdapter'],
  express: ['createExpressMiddleware'], fastify: ['createFastifyMiddleware'],
  nestjs: ['createNestMiddleware', 'createNestGuard'],
  schemas: ['whenSchema', 'roleOperationSchema', 'roleSchema', 'rolesSchema']
};
for (const [name, exports] of Object.entries(names)) {
  const specifier = `@rbac/${name}`;
  const cjs = require(specifier), esm = await import(specifier);
  for (const key of exports) assert.strictEqual(esm[key], cjs[key], `${specifier}.${key} identity`);
}
const helpersCjs = require('@rbac/core/helpers'), helpersEsm = await import('@rbac/core/helpers');
assert.strictEqual(helpersEsm.callbackWhen, helpersCjs.callbackWhen);
const { rolesSchema } = await import('@rbac/schemas');
assert.equal(typeof rolesSchema.parse, 'function');
const engine = coreEsm.createRBAC({roles: {editor: {can: ['documents:read']}}, enableLogger: false});
assert.equal(await engine.can('editor', 'documents:read'), true);
assert.equal(await engine.can('editor', 'documents:delete'), false);
console.log('Six packages, named exports, CJS/ESM identity, and isolated schemas: OK');
