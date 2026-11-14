import { describe, expect, it } from '@jest/globals';
import RBAC from '../src/index';
import { quoteSQLIdentifier } from '../src/adapters/common';
import { MySQLRoleAdapter } from '../src/adapters/mysql';
import { PostgresRoleAdapter } from '../src/adapters/postgres';
import { cacheGet, cacheSet, ROLE_CACHE_LIMIT, MATCH_CACHE_LIMIT } from '../src/utils/bounded-cache';
import { createPermissionCaches } from '../src/core/permission-cache';
import { callbackWhen, normalizeWhen } from '../src/utils/when';

describe('Conditional authorization regression', () => {
  it('retains distinct conditions on the same glob within a role and across inheritance', async () => {
    const rbac = RBAC<{ owner: boolean; editor: boolean }>({ enableLogger: false })({
      owner: { can: [{ name: 'files:*', when: (p: { owner: boolean; editor: boolean }) => p.owner }] },
      editor: { can: [{ name: 'files:*', when: (p: { owner: boolean; editor: boolean }) => p.editor }] },
      combined: {
        inherits: ['owner', 'editor'],
        can: [{ name: 'files:*', when: (p: { owner: boolean; editor: boolean }) => p.owner && p.editor }]
      }
    });
    await expect(rbac.can('combined', 'files:read', { owner: true, editor: false })).resolves.toBe(true);
    await expect(rbac.can('combined', 'files:read', { owner: false, editor: true })).resolves.toBe(true);
    await expect(rbac.can('combined', 'files:read', { owner: false, editor: false })).resolves.toBe(false);
    await expect(rbac.can('combined', 'files:read', { owner: true, editor: true })).resolves.toBe(true);
  });

  it('ORs duplicate exact conditional permissions without caching a parameter-dependent result', async () => {
    const rbac = RBAC<{ first: boolean; second: boolean }>({ enableLogger: false })({
      role: { can: [
        { name: 'approve', when: (p: { first: boolean; second: boolean }) => p.first },
        { name: 'approve', when: (p: { first: boolean; second: boolean }) => p.second }
      ] }
    });
    await expect(rbac.can('role', 'approve', { first: true, second: false })).resolves.toBe(true);
    await expect(rbac.can('role', 'approve', { first: false, second: true })).resolves.toBe(true);
    await expect(rbac.can('role', 'approve', { first: false, second: false })).resolves.toBe(false);
  });

  it('preserves conditional regex grants alongside identical patterns', async () => {
    const rbac = RBAC<boolean>({ enableLogger: false })({
      role: { can: [
        { name: '/^files:.*$/', when: (params: boolean) => params },
        { name: '/^files:.*$/', when: (params: boolean) => !params }
      ] }
    });
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
