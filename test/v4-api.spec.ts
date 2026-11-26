import { describe, expect, it } from '@jest/globals';
import { createRBAC } from '@rbac/core';

describe('v4 public factory', () => {
  it('takes roles and options in one object and supports updates', async () => {
    const engine = createRBAC({ roles: {user: {can: ['posts:read']}}, enableLogger: false });
    await expect(engine.can('user', 'posts:read')).resolves.toBe(true);
    await expect(engine.can('user', 'posts:delete')).resolves.toBe(false);
    engine.addRole('editor', {can: ['posts:write'], inherits: ['user']});
    await expect(engine.can('editor', 'posts:read')).resolves.toBe(true);
    engine.updateRoles({editor: {can: ['posts:delete'], inherits: ['user']}});
    await expect(engine.can('editor', 'posts:delete')).resolves.toBe(true);
    await expect(engine.can('editor', 'posts:write')).resolves.toBe(false);
  });

  it('drops a deleted role and its inherited grants when rebuilding from a full snapshot', async () => {
    const editor = { inherits: ['admin'], can: ['posts:edit'] };
    const engine = createRBAC({ roles: { admin: { can: ['posts:delete'] }, editor } });
    await expect(engine.can('admin', 'posts:delete')).resolves.toBe(true);
    await expect(engine.can('editor', 'posts:delete')).resolves.toBe(true);

    const remainingRoles = { editor };
    engine.updateRoles(remainingRoles);
    await expect(engine.can('admin', 'posts:delete')).resolves.toBe(true);
    await expect(engine.can('editor', 'posts:delete')).resolves.toBe(true);

    const reloaded = createRBAC({ roles: remainingRoles });
    await expect(reloaded.can('admin', 'posts:delete')).resolves.toBe(false);
    await expect(reloaded.can('editor', 'posts:delete')).resolves.toBe(false);
    await expect(reloaded.can('editor', 'posts:edit')).resolves.toBe(true);
  });

  it('fails closed for unknown/prototype-like roles and predicate errors', async () => {
    const engine = createRBAC({roles: {
      toString: {can: ['safe']},
      denied: {can: [{name: 'danger', when: () => { throw Error('predicate failure'); }}]}
    }, enableLogger: false});
    await expect(engine.can('toString', 'safe')).resolves.toBe(true);
    await expect(engine.can('constructor', 'safe')).resolves.toBe(false);
    await expect(engine.can('denied', 'danger')).resolves.toBe(false);
  });
});
