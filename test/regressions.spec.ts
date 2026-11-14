import { describe, expect, it } from '@jest/globals';
import { createRBAC } from '@rbac/core';
import { quoteSQLIdentifier } from '../packages/adapters/src/adapters/common';
import { MySQLRoleAdapter } from '../packages/adapters/src/adapters/mysql';
import { PostgresRoleAdapter } from '../packages/adapters/src/adapters/postgres';
import { cacheGet, cacheSet, ROLE_CACHE_LIMIT, MATCH_CACHE_LIMIT } from '../packages/core/src/utils/bounded-cache';
import { createPermissionCaches } from '../packages/core/src/core/permission-cache';
import { callbackWhen, normalizeWhen } from '../packages/core/src/utils/when';

describe('Conditional authorization regression', () => {
  it('retains distinct conditions on the same glob within a role and across inheritance', async () => {
    const rbac = createRBAC<{ owner: boolean; editor: boolean }>({ ...({ enableLogger: false }), roles: {
      owner: { can: [{ name: 'files:*', when: (p: { owner: boolean; editor: boolean }) => p.owner }] },
      editor: { can: [{ name: 'files:*', when: (p: { owner: boolean; editor: boolean }) => p.editor }] },
      combined: {
        inherits: ['owner', 'editor'],
        can: [{ name: 'files:*', when: (p: { owner: boolean; editor: boolean }) => p.owner && p.editor }]
      }
    } });
    await expect(rbac.can('combined', 'files:read', { owner: true, editor: false })).resolves.toBe(true);
    await expect(rbac.can('combined', 'files:read', { owner: false, editor: true })).resolves.toBe(true);
    await expect(rbac.can('combined', 'files:read', { owner: false, editor: false })).resolves.toBe(false);
    await expect(rbac.can('combined', 'files:read', { owner: true, editor: true })).resolves.toBe(true);
  });

  it('ORs duplicate exact conditional permissions without caching a parameter-dependent result', async () => {
    const rbac = createRBAC<{ first: boolean; second: boolean }>({ ...({ enableLogger: false }), roles: {
      role: { can: [
        { name: 'approve', when: (p: { first: boolean; second: boolean }) => p.first },
        { name: 'approve', when: (p: { first: boolean; second: boolean }) => p.second }
      ] }
    } });
    await expect(rbac.can('role', 'approve', { first: true, second: false })).resolves.toBe(true);
    await expect(rbac.can('role', 'approve', { first: false, second: true })).resolves.toBe(true);
    await expect(rbac.can('role', 'approve', { first: false, second: false })).resolves.toBe(false);
  });

  it('preserves conditional regex grants alongside identical patterns', async () => {
    const rbac = createRBAC<boolean>({ ...({ enableLogger: false }), roles: {
      role: { can: [
        { name: '/^files:.*$/', when: (params: boolean) => params },
        { name: '/^files:.*$/', when: (params: boolean) => !params }
      ] }
    } });
    await expect(rbac.can('role', 'files:read', true)).resolves.toBe(true);
    await expect(rbac.can('role', 'files:read', false)).resolves.toBe(true);
  });
});

describe('SQL identifier safety', () => {
  it.each(['roles; DROP TABLE users', 'roles` WHERE 1=1 --', 'roles" OR 1=1 --', 'roles table', 'roles..users', '1roles', ''])('rejects invalid table %s', table => {
    expect(() => new MySQLRoleAdapter({ table })).toThrow(TypeError);
    expect(() => new PostgresRoleAdapter({ table })).toThrow(TypeError);
  });

  it('rejects injected columns, including tenant column', () => {
    expect(() => new MySQLRoleAdapter({ table: 'roles', columns: { name: 'id`, admin=1 --' } })).toThrow(TypeError);
    expect(() => new PostgresRoleAdapter({ table: 'roles', columns: { tenantId: 'tenant_id OR TRUE' } })).toThrow(TypeError);
  });

  it('quotes validated identifiers for both SQL dialects', () => {
    expect(quoteSQLIdentifier('audit.roles', 'postgres', true)).toBe('"audit"."roles"');
    expect(quoteSQLIdentifier('audit.roles', 'mysql', true)).toBe('`audit`.`roles`');
    expect(quoteSQLIdentifier('order', 'postgres')).toBe('"order"');
    expect(() => quoteSQLIdentifier('audit.roles', 'postgres')).toThrow(TypeError);
  });
});

describe('Cache bounds', () => {
  it('evicts the least recently used key and preserves more recent keys', () => {
    const cache = new Map<string, number>();
    cacheSet(cache, 'first', 1, 2);
    cacheSet(cache, 'second', 2, 2);
    expect(cacheGet(cache, 'first')).toBe(1);
    cacheSet(cache, 'third', 3, 2);
    expect([...cache.keys()]).toEqual(['first', 'third']);
  });

  it('caps role and per-role operation caches', () => {
    const top = new Map<string, Map<string, boolean>>();
    const { getRoleCache, getPatternCache } = createPermissionCaches(top);
    for (let i = 0; i <= ROLE_CACHE_LIMIT; i++) {
      getRoleCache(`role-${i}`);
      getPatternCache(`role-${i}`);
    }
    expect(top.size).toBe(ROLE_CACHE_LIMIT);
    expect(top.has('role-0')).toBe(false);
    const roleCache = getRoleCache('last');
    for (let i = 0; i <= MATCH_CACHE_LIMIT; i++) {
      cacheSet(roleCache, `operation-${i}`, true, MATCH_CACHE_LIMIT);
    }
    expect(roleCache.size).toBe(MATCH_CACHE_LIMIT);
  });
});

describe('Explicit callback predicates', () => {
  it('normalizes callback predicates without inspecting Function.length', async () => {
    const predicate = callbackWhen<boolean>((p, done) => done(null, p));
    expect(await predicate(true)).toBe(true);
    expect(await predicate(false)).toBe(false);
    const normalized = normalizeWhen<boolean>(predicate);
    if (normalized !== true) {
      expect(await normalized(true)).toBe(true);
    }
  });
});

describe('Fast authorization path', () => {
  it('keeps literal misses fast without skipping glob and regex queries', async () => {
    const rbac = createRBAC({
      roles: { reader: { can: ['reports:read'] } },
      enableLogger: false
    });
    await expect(rbac.can('reader', 'reports:write')).resolves.toBe(false);
    await expect(rbac.can('reader', 'reports:*')).resolves.toBe(true);
    await expect(rbac.can('reader', '/^reports:read$/')).resolves.toBe(true);
    await expect(rbac.can('reader', /^reports:read$/)).resolves.toBe(true);
    await expect(rbac.can('unknown', 'reports:read')).resolves.toBe(false);
    expect(rbac.can('reader', 'reports:read')).toBeInstanceOf(Promise);
  });

  it('does not grant wildcard queries through the indexed literal-glob shortcut', async () => {
    const rbac = createRBAC({
      roles: { reader: { can: ['reports:*'] } },
      enableLogger: false
    });
    await expect(rbac.can('reader', 'reports:edit')).resolves.toBe(true);
    await expect(rbac.can('reader', 'reports:arch*')).resolves.toBe(false);
    await expect(rbac.can('reader', 'reports:arch*')).resolves.toBe(false);
    await expect(rbac.can('reader', 'reports:*')).resolves.toBe(true);
  });

  it('invalidates static pattern caches on role updates without caching conditions', async () => {
    const rbac = createRBAC<{ allowed: boolean }>({
      roles: {
        reader: { can: ['/^items:[0-9]+$/', 'events:42'] },
        guarded: { can: [{ name: 'items:*', when: ({ allowed }: { allowed: boolean }) => allowed }] }
      },
      enableLogger: false
    });
    for (let i = 0; i < 3; i += 1) {
      await expect(rbac.can('reader', 'items:42')).resolves.toBe(true);
      await expect(rbac.can('reader', 'items:word')).resolves.toBe(false);
      await expect(rbac.can('reader', /^events:42$/)).resolves.toBe(true);
      await expect(rbac.can('guarded', 'items:42', { allowed: false })).resolves.toBe(false);
      await expect(rbac.can('guarded', 'items:42', { allowed: true })).resolves.toBe(true);
    }
    rbac.updateRoles({ reader: { can: ['items:word'] } });
    await expect(rbac.can('reader', 'items:42')).resolves.toBe(false);
    await expect(rbac.can('reader', 'items:word')).resolves.toBe(true);
    await expect(rbac.can('reader', /^events:42$/)).resolves.toBe(false);
  });

  it('logs every fast decision and turns logger exceptions into rejected promises', async () => {
    const records: Array<[string, string | RegExp, boolean, boolean | undefined]> = [];
    const rbac = createRBAC({
      roles: { reader: { can: ['files:read', 'reports:*', '/^logs:[0-9]+$/'] } },
      enableLogger: true,
      colors: false,
      logger: (role, operation, result, colors) => records.push([role, operation, result, colors])
    });
    await rbac.can('reader', 'files:read');
    await rbac.can('reader', 'reports:edit');
    await rbac.can('reader', 'logs:1');
    await rbac.can('reader', 'logs:1'); // cached pattern grant
    await rbac.can('reader', 'missing');
    await rbac.can('missing', 'files:read');
    expect(records).toEqual([
      ['reader', 'files:read', true, false],
      ['reader', 'reports:edit', true, false],
      ['reader', 'logs:1', true, false],
      ['reader', 'logs:1', true, false],
      ['reader', 'missing', false, false],
      ['missing', 'files:read', false, false]
    ]);

    const failingLogger = createRBAC({
      roles: { reader: { can: ['files:read'] } },
      enableLogger: true,
      logger: () => { throw new Error('logger failure'); }
    });
    await expect(failingLogger.can('reader', 'files:read')).rejects.toThrow('logger failure');
    await expect(failingLogger.can('reader', 'missing')).rejects.toThrow('logger failure');
  });
});
