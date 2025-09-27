import { describe, expect, it } from '@jest/globals';
import rbac from '../src/index';
import type { Roles } from '../src/types';

const belongsToAccount = (
  params: boolean,
  done: (err: unknown, value?: boolean) => void
): void => done(null, params);

const promiseBelongsToAccount: Promise<boolean> = Promise.resolve(true);

const asyncBelongsToAccount = async (params: boolean): Promise<boolean> => params;

const defaultRoles: Roles<boolean> = {
  user: {
    can: ['products:find']
  },
  supervisor: {
    can: [{ name: 'products:edit', when: promiseBelongsToAccount }],
    inherits: ['user']
  },
  admin: {
    can: [{name: 'products:delete', when: belongsToAccount }],
    inherits: ['supervisor']
  },
  superadmin: {
    can: ['products:find', 'products:edit', 'products:delete']
  },
  superhero: {
    can: ['products:*']
  },
  asyncrole: {
    can: [{ name: 'products:async', when: asyncBelongsToAccount }]
  }
};

describe('RBAC lib aspects', () => {
  it('RBAC config should be a function', () => {
    expect(typeof rbac).toBe('function');
  });

  it('should return a function', () => {
    const result = rbac<boolean>();
    expect(typeof result).toBe('function');
  });

  it('should return an object with a property named [can] when rbac function is called', () => {
    const instance = rbac<boolean>()(defaultRoles);
    expect(typeof instance).toBe('object');
    expect(instance).toHaveProperty('can');
  });
});

describe('RBAC', () => {
  const RBAC = rbac<boolean>({ enableLogger: false })(defaultRoles);

  describe('user role', () => {
    it('[user] should have permission [products:find]', async () => {
      const result = await RBAC.can('user', 'products:find');
      expect(result).toBe(true);
    });

    it('[user] should not have permission [wrong:operation]', async () => {
      const result = await RBAC.can('user', 'wrong:operation');
      expect(result).toBe(false);
    });

    it('[user] should not have [supervisor] permissions [products:edit]', async () => {
      const result = await RBAC.can('user', 'products:edit');
      expect(result).toBe(false);
    });

    it('[user] should not have admin permissions [products:delete]', async () => {
      const result = await RBAC.can('user', 'products:delete');
      expect(result).toBe(false);
    });

    it('[user] should have permission when string regex is passed', async () => {
      const result = await RBAC.can('user', '/prod/');
      expect(result).toBe(true);
    });

    it('[user] should have permission when regex is passed', async () => {
      const result = await RBAC.can('user', /products/);
      expect(result).toBe(true);
    });

    it('[user] should have permission when glob is passed', async () => {
      const result = await RBAC.can('user', 'products*');
      expect(result).toBe(true);
    });

    it('[user] should  not have permission when not allowed glob is passed', async () => {
      const result = await RBAC.can('user', 'products:del*');
      expect(result).toBe(false);
    });

  });

  describe('supervisor role', () => {

    it('[supervisor] should have permission [products:edit]', async () => {
      const result = await RBAC.can('supervisor', 'products:edit');

      expect(result).toBe(true);
    });

    it('[supervisor] should have [user] inherited permission [products:find]', async () => {
      const result = await RBAC.can('supervisor', 'products:find');

      expect(result).toBe(true);
    });

    it('[supervisor] should not have admin permission [products:delete]', async () => {
      const result = await RBAC.can('supervisor', 'products:delete');

      expect(result).toBe(false);
    });

    it('[supervisor] should not have permission [wrong:operation]', async () => {
      const result = await RBAC.can('supervisor', 'wrong:operation');

      expect(result).toBe(false);
    });

  });

  describe('admin role', () => {

    it('[admin] should have permission [products:delete]', async () => {
      const result = await RBAC.can('admin', 'products:delete', true);

      expect(result).toBe(true);
    });

    it('[admin] should not have permission if when returns falsy [products:delete]', async () => {
      const result = await RBAC.can('admin', 'products:delete', false);

      expect(result).toBe(false);
    });

    it('[admin] should have [user] inherited permission [products:find]', async () => {
      const result = await RBAC.can('admin', 'products:find');

      expect(result).toBe(true);
    });

    it('[admin] should have [supervisor] inherited permission [products:edit]', async () => {
      const result = await RBAC.can('admin', 'products:edit');

      expect(result).toBe(true);
    });

    it('[admin] should not have permission [wrong:operation]', async () => {
      const result = await RBAC.can('admin', 'wrong:operation');

      expect(result).toBe(false);
    });

  });

  describe('superadmin role', () => {

    it('[superadmin] should have permission [products:find]', async () => {
      const result = await RBAC.can('superadmin', 'products:find');

      expect(result).toBe(true);
    });

    it('[superadmin] should have permission [products:edit]', async () => {
      const result = await RBAC.can('superadmin', 'products:edit');

      expect(result).toBe(true);
    });

    it('[superadmin] should have permission [products:delete]', async () => {
      const result = await RBAC.can('superadmin', 'products:delete');

      expect(result).toBe(true);
    });

    it('[superadmin] should not have permission [wrong:operation]', async () => {
      const result = await RBAC.can('superadmin', 'wrong:operation');

      expect(result).toBe(false);
    });

    it('[superadmin] should have permission when string regex is passed', async () => {
      const result = await RBAC.can('superadmin', '/products/gi');
      expect(result).toBe(true);
    });

    it('[superadmin] should have permission when regex is passed', async () => {
      const result = await RBAC.can('superadmin', /products/gi);
      expect(result).toBe(true);
    });

    it('[superadmin] should have permission when glob is passed', async () => {
      const result = await RBAC.can('superadmin', 'products*');
      expect(result).toBe(true);
    });

    it('[superadmin] should have not permission when wrong glob is passed', async () => {
      const result = await RBAC.can('superadmin', 'wrong*');
      expect(result).toBe(false);
    });

  });

  describe('superhero role', () => {

    it('[superhero] should have permission [products:find]', async () => {
      const result = await RBAC.can('superhero', 'products:find');

      expect(result).toBe(true);
    });

    it('[superhero] should have permission [products:edit]', async () => {
      const result = await RBAC.can('superhero', 'products:edit');

      expect(result).toBe(true);
    });

    it('[superhero] should have permission [products:delete]', async () => {
      const result = await RBAC.can('superhero', 'products:delete');

      expect(result).toBe(true);
    });

    it('[superhero] should not have permission [wrong:operation]', async () => {
      const result = await RBAC.can('superhero', 'wrong:operation');

      expect(result).toBe(false);
    });

    it('[superhero] should have permission when string regex is passed', async () => {
      const result = await RBAC.can('superhero', '/products/gi');
      expect(result).toBe(true);
    });

    it('[superhero] should have permission when regex is passed', async () => {
      const result = await RBAC.can('superhero', /products/gi);
      expect(result).toBe(true);
    });

    it('[superhero] should have permission when glob is passed', async () => {
      const result = await RBAC.can('superhero', 'products*');
      expect(result).toBe(true);
    });

    it('[superhero] should have not permission when wrong glob is passed', async () => {
      const result = await RBAC.can('superhero', 'wrong*');
      expect(result).toBe(false);
    });
  });

  describe('asyncrole role', () => {
    it('[asyncrole] should have permission when async when returns truthy', async () => {
      const result = await RBAC.can('asyncrole', 'products:async', true);
      expect(result).toBe(true);
    });

    it('[asyncrole] should not have permission when async when returns falsy', async () => {
      const result = await RBAC.can('asyncrole', 'products:async', false);
      expect(result).toBe(false);
    });
  });

  describe('runtime role updates', () => {
    it('should allow permissions for a role added at runtime', async () => {
      RBAC.addRole('editor', { can: ['products:update'], inherits: ['user'] });
      const resEdit = await RBAC.can('editor', 'products:update');
      const resFind = await RBAC.can('editor', 'products:find');
      expect(resEdit).toBe(true);
      expect(resFind).toBe(true);
    });

    it('should respect updated roles when using can', async () => {
      RBAC.updateRoles({
        user: { can: ['products:find', 'products:create'] }
      });
      const resCreate = await RBAC.can('user', 'products:create');
      expect(resCreate).toBe(true);
    });

    it('should rebuild hierarchy when inheritance changes at runtime', async () => {
      RBAC.addRole('dynamic', { can: [], inherits: ['user'] });
      const before = await RBAC.can('dynamic', 'products:delete', true);
      expect(before).toBe(false);

      RBAC.updateRoles({
        dynamic: { can: [], inherits: ['admin'] }
      });

      const after = await RBAC.can('dynamic', 'products:delete', true);
      expect(after).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle circular inheritance without crashing', async () => {
      RBAC.addRole('a', { can: ['products:find'], inherits: ['b'] });
      RBAC.addRole('b', { can: [], inherits: ['a'] });
      const res = await RBAC.can('a', 'products:find');
      expect(res).toBe(true);
    });

    it('should ignore unknown parent roles', async () => {
      RBAC.addRole('phantom', { can: ['products:find'], inherits: ['ghost'] });
      const allowed = await RBAC.can('phantom', 'products:find');
      const denied = await RBAC.can('phantom', 'products:delete');
      expect(allowed).toBe(true);
      expect(denied).toBe(false);
    });

    it('should handle empty roles object', async () => {
      const emptyRBAC = rbac({ enableLogger: false })({});
      const res = await emptyRBAC.can('any', 'any');
      expect(res).toBe(false);
    });

    it('should handle role with empty can array', async () => {
      RBAC.addRole('empty', { can: [] });
      const res = await RBAC.can('empty', 'products:find');
      expect(res).toBe(false);
    });

    it('should handle role with undefined can', async () => {
      RBAC.addRole('undefined', { can: [] });
      const res = await RBAC.can('undefined', 'products:find');
      expect(res).toBe(false);
    });

    it('should handle role with null can', async () => {
      RBAC.addRole('null', { can: [] });
      const res = await RBAC.can('null', 'products:find');
      expect(res).toBe(false);
    });

    it('should handle complex circular inheritance', async () => {
      RBAC.addRole('x', { can: ['test'], inherits: ['y'] });
      RBAC.addRole('y', { can: [], inherits: ['z'] });
      RBAC.addRole('z', { can: [], inherits: ['x'] });
      const res = await RBAC.can('x', 'test');
      expect(res).toBe(true);
    });

    it('should handle deeply nested inheritance', async () => {
      RBAC.addRole('level1', { can: ['level1:action'] });
      RBAC.addRole('level2', { can: ['level2:action'], inherits: ['level1'] });
      RBAC.addRole('level3', { can: ['level3:action'], inherits: ['level2'] });
      RBAC.addRole('level4', { can: ['level4:action'], inherits: ['level3'] });
      RBAC.addRole('level5', { can: ['level5:action'], inherits: ['level4'] });
      
      const res = await RBAC.can('level5', 'level1:action');
      expect(res).toBe(true);
    });

    it('should handle role with mixed permission types', async () => {
      RBAC.addRole('mixed', {
        can: [
          'direct:permission',
          { name: 'conditional:permission', when: async () => true },
          { name: 'glob:*', when: true },
          { name: '/regex:\\d+/', when: true }
        ]
      });
      
      expect(await RBAC.can('mixed', 'direct:permission')).toBe(true);
      expect(await RBAC.can('mixed', 'conditional:permission')).toBe(true);
      expect(await RBAC.can('mixed', 'glob:anything')).toBe(true);
      expect(await RBAC.can('mixed', 'regex:123')).toBe(true);
      expect(await RBAC.can('mixed', 'regex:abc')).toBe(false);
    });

    it('should handle when function that throws', async () => {
      RBAC.addRole('throwing', {
        can: [{ name: 'test', when: async () => { throw new Error('test'); } }]
      });
      
      const res = await RBAC.can('throwing', 'test');
      expect(res).toBe(false);
    });

    it('should handle when function that returns false', async () => {
      RBAC.addRole('false', {
        can: [{ name: 'test', when: async () => false }]
      });
      
      const res = await RBAC.can('false', 'test');
      expect(res).toBe(false);
    });

    it('should handle when function that returns truthy non-boolean', async () => {
      RBAC.addRole('truthy', {
        can: [{ name: 'test', when: async () => 'truthy' as any }]
      });
      
      const res = await RBAC.can('truthy', 'test');
      expect(res).toBe(true);
    });

    it('should handle when function that returns falsy non-boolean', async () => {
      RBAC.addRole('falsy', {
        can: [{ name: 'test', when: async () => 0 as any }]
      });
      
      const res = await RBAC.can('falsy', 'test');
      expect(res).toBe(false);
    });

    it('should handle callback when function with error', async () => {
      const callbackWhen = (params: any, done: (err: Error | null, result: boolean) => void) => {
        setImmediate(() => done(new Error('test'), false));
      };
      
      RBAC.addRole('callback-error', {
        can: [{ name: 'test', when: callbackWhen }]
      });
      
      const res = await RBAC.can('callback-error', 'test');
      expect(res).toBe(false);
    });

    it('should handle callback when function with success', async () => {
      const callbackWhen = (params: any, done: (err: Error | null, result: boolean) => void) => {
        setImmediate(() => done(null, true));
      };
      
      RBAC.addRole('callback-success', {
        can: [{ name: 'test', when: callbackWhen }]
      });
      
      const res = await RBAC.can('callback-success', 'test');
      expect(res).toBe(true);
    });

    it('should handle Promise when function', async () => {
      RBAC.addRole('promise', {
        can: [{ name: 'test', when: Promise.resolve(true) }]
      });
      
      const res = await RBAC.can('promise', 'test');
      expect(res).toBe(true);
    });

    it('should handle Promise when function that rejects', async () => {
      const rejectingPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error('test')), 0);
      });
      RBAC.addRole('promise-reject', {
        can: [{ name: 'test', when: rejectingPromise }]
      });
      
      const res = await RBAC.can('promise-reject', 'test');
      expect(res).toBe(false);
    });

    it('should handle when function with parameters', async () => {
      const whenWithParams = async (params: any) => {
        return params?.userId === 'admin';
      };
      
      RBAC.addRole('params', {
        can: [{ name: 'test', when: whenWithParams }]
      });
      
      const res1 = await RBAC.can('params', 'test', { userId: 'admin' } as any);
      const res2 = await RBAC.can('params', 'test', { userId: 'user' } as any);
      expect(res1).toBe(true);
      expect(res2).toBe(false);
    });

    it('should handle RegExp operations', async () => {
      RBAC.addRole('regex', { can: [{ name: 'user:123', when: true }] });
      
      expect(await RBAC.can('regex', 'user:123')).toBe(true);
      expect(await RBAC.can('regex', 'user:abc')).toBe(false);
      expect(await RBAC.can('regex', 'admin:123')).toBe(false);
    });

    it('should handle string regex operations', async () => {
      RBAC.addRole('string-regex', { can: ['/user:\\d+/'] });
      
      expect(await RBAC.can('string-regex', 'user:123')).toBe(true);
      expect(await RBAC.can('string-regex', 'user:abc')).toBe(false);
    });

    it('should handle invalid regex strings gracefully', async () => {
      RBAC.addRole('invalid-regex', { can: ['/invalid[/'] });
      
      const res = await RBAC.can('invalid-regex', 'test');
      expect(res).toBe(false);
    });

    it('should handle glob patterns', async () => {
      RBAC.addRole('glob', { can: ['user:*'] });
      
      expect(await RBAC.can('glob', 'user:read')).toBe(true);
      expect(await RBAC.can('glob', 'user:write')).toBe(true);
      expect(await RBAC.can('glob', 'admin:read')).toBe(false);
    });

    it('should handle complex glob patterns', async () => {
      RBAC.addRole('complex-glob', { can: ['**/*.js'] });
      
      expect(await RBAC.can('complex-glob', 'src/file.js')).toBe(true);
      expect(await RBAC.can('complex-glob', 'src/subdir/file.js')).toBe(true);
      expect(await RBAC.can('complex-glob', 'src/file.ts')).toBe(false);
    });

    it('should handle updateRoles with new roles', async () => {
      const newRoles = {
        newRole: { can: ['new:permission'] }
      };
      
      RBAC.updateRoles(newRoles);
      const res = await RBAC.can('newRole', 'new:permission');
      expect(res).toBe(true);
    });

    it('should handle updateRoles with existing roles', async () => {
      RBAC.updateRoles({
        user: { can: ['products:find', 'products:view'] }
      });
      
      expect(await RBAC.can('user', 'products:find')).toBe(true);
      expect(await RBAC.can('user', 'products:view')).toBe(true);
      expect(await RBAC.can('user', 'products:edit')).toBe(false);
    });

    it('should handle addRole with complex role definition', async () => {
      RBAC.addRole('complex', {
        can: [
          'direct:permission',
          { name: 'conditional:permission', when: async () => true },
          'glob:*',
          '/regex:\\d+/',
          { name: 'callback:permission', when: (params: any, done: any) => done(null, true) }
        ],
        inherits: ['user']
      });
      
      expect(await RBAC.can('complex', 'direct:permission')).toBe(true);
      expect(await RBAC.can('complex', 'conditional:permission')).toBe(true);
      expect(await RBAC.can('complex', 'glob:anything')).toBe(true);
      expect(await RBAC.can('complex', 'regex:123')).toBe(true);
      expect(await RBAC.can('complex', 'callback:permission')).toBe(true);
      expect(await RBAC.can('complex', 'products:find')).toBe(true); // inherited
    });
  });
});
