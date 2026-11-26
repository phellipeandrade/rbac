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
    await expect(engine.can('editor', 'posts:read')).resolves.toBe(true);
  });

  it('replaces the full role set for existing callers, including cached matches', async () => {
    const editor = { inherits: ['admin'], can: ['posts:edit'] };
    const engine = createRBAC({ roles: { admin: { can: ['posts:delete'] }, editor } });
    const { can } = engine;
    const deleteQuery = /^posts:delete$/;
    const publishQuery = /^posts:publish$/;
    await expect(can('admin', 'posts:delete')).resolves.toBe(true);
    await expect(can('editor', deleteQuery)).resolves.toBe(true);
    await expect(can('editor', publishQuery)).resolves.toBe(false);

    engine.replaceRoles({ editor: { ...editor, can: ['posts:edit', 'posts:publish'] } });

    await expect(can('admin', 'posts:delete')).resolves.toBe(false);
    await expect(can('editor', 'posts:delete')).resolves.toBe(false);
    await expect(can('editor', deleteQuery)).resolves.toBe(false);
    await expect(can('editor', publishQuery)).resolves.toBe(true);
    await expect(can('editor', 'posts:edit')).resolves.toBe(true);

    engine.updateRoles({ viewer: { can: ['posts:read'] } });
    await expect(can('admin', 'posts:delete')).resolves.toBe(false);
    await expect(can('editor', 'posts:edit')).resolves.toBe(true);
    await expect(can('viewer', 'posts:read')).resolves.toBe(true);

    engine.replaceRoles({});
    await expect(can('editor', 'posts:edit')).resolves.toBe(false);
    await expect(can('viewer', 'posts:read')).resolves.toBe(false);
  });

  it('uses the new predicates for checks started after replacement', async () => {
    let allowPreviousCheck!: (allowed: boolean) => void;
    const previousCondition = new Promise<boolean>(resolve => { allowPreviousCheck = resolve; });
    const engine = createRBAC<boolean>({
      roles: { editor: { can: [{ name: 'posts:edit', when: () => previousCondition }] } }
    });
    const pending = engine.can('editor', 'posts:edit', false);

    engine.replaceRoles({
      editor: { can: [{ name: 'posts:edit', when: (ownsPost: boolean) => ownsPost }] }
    });

    await expect(engine.can('editor', 'posts:edit', false)).resolves.toBe(false);
    await expect(engine.can('editor', 'posts:edit', true)).resolves.toBe(true);
    allowPreviousCheck(true);
    await expect(pending).resolves.toBe(true);
    await expect(engine.can('editor', 'posts:edit', false)).resolves.toBe(false);
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
