import {describe, expect, it} from '@jest/globals';
import {roleSchema, rolesSchema, whenSchema} from '@rbac/schemas';

describe('Zod v4 validation schemas', () => {
  it('accepts direct and inherited grants and preserves condition functions', () => {
    const condition = (params: unknown) => params === 'owner';
    const roles = rolesSchema.parse({
      viewer: {can: ['post:read']},
      editor: {inherits: ['viewer'], can: [{name: 'post:edit', when: condition}]},
    });

    expect(roles.editor.can[0]).toEqual({name: 'post:edit', when: condition});
    expect(roles.editor.inherits).toEqual(['viewer']);
    expect(whenSchema.parse(condition)).toBe(condition);
  });

  it('accepts supported boolean, promise, async and callback conditions', () => {
    const promise = Promise.resolve(true);
    const callback = (_params: unknown, done: (err: unknown, result?: boolean) => void) =>
      done(null, true);
    const asyncPredicate = async () => true;

    for (const condition of [true, false, promise, callback, asyncPredicate]) {
      expect(whenSchema.parse(condition)).toBe(condition);
      expect(roleSchema.safeParse({can: [{name: 'post:edit', when: condition}]}).success).toBe(true);
    }
  });

  it('rejects invalid grants and conditions', () => {
    expect(roleSchema.safeParse({can: [{name: 'post:edit', when: 42}]}).success).toBe(false);
    expect(roleSchema.safeParse({can: [{name: 'post:edit', when: {then: () => true}}]}).success).toBe(false);
    expect(rolesSchema.safeParse({viewer: {can: [null]}}).success).toBe(false);
    expect(rolesSchema.safeParse({viewer: {can: ['post:read'], inherits: [0]}}).success).toBe(false);
  });
});
