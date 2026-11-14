import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {entries} from './package-manifest.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const scratch = mkdtempSync(path.join(tmpdir(), 'rbac-v4-pack-'));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(command, args, cwd = root) {
  return execFileSync(command, args, {cwd, encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'], shell: process.platform === 'win32'});
}

try {
  const tarballs = [];
  for (const {name} of entries) {
    const pkg = `@rbac/${name}`;
    const [info] = JSON.parse(run(npm, ['pack', '-w', pkg, '--json', '--pack-destination', scratch]));
    assert.equal(info.name, pkg);
    assert.equal(info.version, '4.0.0');
    const files = new Set(info.files.map(file => file.path));
    for (const expected of ['package.json', 'README.md', 'MIGRATION.md', 'lib/index.js',
      'lib/index.mjs', 'lib/index.d.ts', 'lib/index.d.cts', 'lib/index.d.mts']) {
      assert(files.has(expected), `${pkg}: tarball missing ${expected}`);
    }
    assert(!info.files.some(file => file.path.startsWith('src/')), `${pkg}: source leaked into tarball`);
    tarballs.push(path.join(scratch, info.filename));
  }

  writeFileSync(path.join(scratch, 'package.json'), JSON.stringify({name: 'rbac-isolated-consumer',
    version: '1.0.0', private: true, type: 'module'}, null, 2));
  run(npm, ['install', '--no-audit', '--no-fund', '--ignore-scripts', '--package-lock=false', ...tarballs], scratch);

  writeFileSync(path.join(scratch, 'probe.mjs'), `
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const core = await import('@rbac/core');
assert.equal(core.createRBAC, require('@rbac/core').createRBAC);
assert.equal(core.default, undefined);
assert.deepEqual(Object.keys(require('@rbac/core/package.json').dependencies), []);
const helpers = await import('@rbac/core/helpers');
assert.equal(helpers.callbackWhen, require('@rbac/core/helpers').callbackWhen);
for (const name of ['adapters', 'express', 'fastify', 'nestjs', 'schemas']) {
  const esm = await import('@rbac/' + name);
  const cjs = require('@rbac/' + name);
  for (const [key, value] of Object.entries(cjs)) assert.equal(esm[key], value, name + '.' + key);
}
assert.equal(typeof (await import('@rbac/schemas')).rolesSchema.parse, 'function');
const auth = core.createRBAC({roles: {viewer: {can: ['files:read']}}, enableLogger: false});
assert.equal(await auth.can('viewer', 'files:read'), true);
assert.equal(await auth.can('viewer', 'files:write'), false);
assert.equal(await auth.can('missing', 'files:read'), false);
console.log('Installed tarballs: six CJS/ESM packages, API, isolation and deny-by-default OK');
`);
  run(process.execPath, ['probe.mjs'], scratch);

  writeFileSync(path.join(scratch, 'consumer.mts'), `
import {createRBAC} from '@rbac/core';
import type {RBACEngine, RBACOptions} from '@rbac/core';
import {createExpressMiddleware} from '@rbac/express';
import {createFastifyMiddleware} from '@rbac/fastify';
import {createNestGuard} from '@rbac/nestjs';
import {MongoRoleAdapter, createTenantRBAC} from '@rbac/adapters';
import {rolesSchema} from '@rbac/schemas';
const options: RBACOptions<boolean> = {roles: {viewer: {can: ['read']}}, enableLogger: false};
const engine: RBACEngine<boolean> = createRBAC(options);
void engine.can('viewer', 'read', true);
// @ts-expect-error Invalid context type must be rejected.
void engine.can('viewer', 'read', 'invalid');
void createExpressMiddleware(engine)('read');
void createFastifyMiddleware(engine)('read');
void createNestGuard(engine)('read');
void createTenantRBAC(new MongoRoleAdapter<boolean>({uri: 'mongodb://localhost', dbName: 'test', collection: 'roles'}), 'tenant-a');
void rolesSchema;
`);
  writeFileSync(path.join(scratch, 'consumer.cts'), `
import {createRBAC} from '@rbac/core';
import type {RBACOptions} from '@rbac/core';
import {callbackWhen} from '@rbac/core/helpers';
const options: RBACOptions<boolean> = {roles: {viewer: {can: [{name: 'read', when: callbackWhen<boolean>((p, done) => done(null, p))}]}}};
void createRBAC(options).can('viewer', 'read', true);
`);
  writeFileSync(path.join(scratch, 'tsconfig.json'), JSON.stringify({compilerOptions: {
    strict: true, target: 'ES2022', module: 'NodeNext', moduleResolution: 'NodeNext',
    skipLibCheck: true, noEmit: true, types: []}, files: ['consumer.mts', 'consumer.cts']}, null, 2));
  run(process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc'), '--project', 'tsconfig.json'], scratch);
  console.log('Six published-style tarballs: contents, isolated installation and TypeScript CJS/ESM consumers OK');
} finally {
  rmSync(scratch, {recursive: true, force: true});
}
