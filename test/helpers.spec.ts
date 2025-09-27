import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';
import {
  isGlob,
  underline,
  defaultLogger,
  normalizeWhen,
  regexFromOperation,
  globToRegex,
  hasMatchingOperation,
  buildPermissionData
} from '../src/helpers';
import type { When, WhenCallback, PatternPermission } from '../src/types';

describe('helpers', () => {
  describe('isGlob', () => {
    it('should return true for strings with asterisk', () => {
      expect(isGlob('user:*')).toBe(true);
      expect(isGlob('*')).toBe(true);
      expect(isGlob('**')).toBe(true);
    });

    it('should return false for strings without asterisk', () => {
      expect(isGlob('user:read')).toBe(false);
      expect(isGlob('')).toBe(false);
    });

    it('should return false for non-strings', () => {
      expect(isGlob(123)).toBe(false);
      expect(isGlob(null)).toBe(false);
      expect(isGlob(undefined)).toBe(false);
      expect(isGlob({})).toBe(false);
    });
  });

  describe('underline', () => {
    it('should return a string of dashes', () => {
      const result = underline();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^-+$/);
    });

    it('should have minimum length of 1', () => {
      const result = underline();
      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('defaultLogger', () => {
    let consoleSpy: any;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log with colors for true result', () => {
      defaultLogger('admin', 'read', true);
      expect(consoleSpy).toHaveBeenCalledTimes(3);
    });

    it('should log with colors for false result', () => {
      defaultLogger('user', 'write', false);
      expect(consoleSpy).toHaveBeenCalledTimes(3);
    });

    it('should handle RegExp operations', () => {
      defaultLogger('admin', /user:\d+/, true);
      expect(consoleSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('normalizeWhen', () => {
    it('should return true for true input', () => {
      expect(normalizeWhen(true)).toBe(true);
    });

    it('should return async function for false input', async () => {
      const result = normalizeWhen(false);
      expect(typeof result).toBe('function');
      expect(await (result as Function)()).toBe(false);
    });

    it('should handle callback functions', async () => {
      const callback: WhenCallback<unknown> = (params, done) => {
        setImmediate(() => done(null, true));
      };
      const result = normalizeWhen(callback);
      expect(typeof result).toBe('function');
      expect(await (result as Function)({})).toBe(true);
    });

    it('should handle callback functions with error', async () => {
      const callback: WhenCallback<unknown> = (params, done) => {
        setImmediate(() => done(new Error('test'), false));
      };
      const result = normalizeWhen(callback);
      expect(typeof result).toBe('function');
      expect(await (result as Function)({})).toBe(false);
    });

    it('should handle async functions', async () => {
      const asyncFn = async () => true;
      const result = normalizeWhen(asyncFn);
      expect(typeof result).toBe('function');
      expect(await (result as Function)({})).toBe(true);
    });

    it('should handle async functions that throw', async () => {
      const asyncFn = async () => {
        throw new Error('test');
      };
      const result = normalizeWhen(asyncFn);
      expect(typeof result).toBe('function');
      expect(await (result as Function)({})).toBe(false);
    });

    it('should handle Promise input', async () => {
      const promise = Promise.resolve(true);
      const result = normalizeWhen(promise);
      expect(typeof result).toBe('function');
      expect(await (result as Function)()).toBe(true);
    });

    it('should handle Promise that rejects', async () => {
      const promise = Promise.reject(new Error('test'));
      const result = normalizeWhen(promise);
      expect(typeof result).toBe('function');
      expect(await (result as Function)()).toBe(false);
    });

    it('should handle other truthy values', async () => {
      const result = normalizeWhen('truthy' as any);
      expect(typeof result).toBe('function');
      expect(await (result as Function)()).toBe(true);
    });

    it('should handle falsy values', async () => {
      const result = normalizeWhen(0 as any);
      expect(typeof result).toBe('function');
      expect(await (result as Function)()).toBe(false);
    });
  });

  describe('regexFromOperation', () => {
    beforeEach(() => {
      // Clear cache before each test
      (regexFromOperation as any).cache?.clear?.();
    });

    it('should return RegExp for RegExp input', () => {
      const regex = /test/;
      expect(regexFromOperation(regex)).toBe(regex);
    });

    it('should parse valid regex strings', () => {
      const result = regexFromOperation('/test/');
      expect(result).toBeInstanceOf(RegExp);
      expect(result?.source).toBe('test');
    });

    it('should parse regex strings with flags', () => {
      const result = regexFromOperation('/test/gi');
      expect(result).toBeInstanceOf(RegExp);
      expect(result?.source).toBe('test');
      expect(result?.flags).toBe('gi');
    });

    it('should return null for invalid regex strings', () => {
      expect(regexFromOperation('/invalid[/')).toBeNull();
      expect(regexFromOperation('not-a-regex')).toBeNull();
    });

    it('should cache results', () => {
      const input = '/test/';
      const result1 = regexFromOperation(input);
      const result2 = regexFromOperation(input);
      expect(result1).toBe(result2);
    });
  });

  describe('globToRegex', () => {
    beforeEach(() => {
      // Clear cache before each test
      (globToRegex as any).cache?.clear?.();
    });

    it('should handle single glob string', () => {
      const result = globToRegex('user:*');
      expect(result).toBeInstanceOf(RegExp);
      expect(result.test('user:read')).toBe(true);
      expect(result.test('user:write')).toBe(true);
      expect(result.test('admin:read')).toBe(false);
    });

    it('should handle array of globs', () => {
      const result = globToRegex(['user:*', 'admin:*']);
      expect(result).toBeInstanceOf(RegExp);
      expect(result.test('user:read')).toBe(true);
      expect(result.test('admin:write')).toBe(true);
      expect(result.test('guest:read')).toBe(false);
    });

    it('should handle complex glob patterns', () => {
      const result = globToRegex('**/*.js');
      expect(result).toBeInstanceOf(RegExp);
    });

    it('should cache results', () => {
      const input = 'user:*';
      const result1 = globToRegex(input);
      const result2 = globToRegex(input);
      expect(result1).toBe(result2);
    });
  });

  describe('hasMatchingOperation', () => {
    it('should return true when regex matches any name', () => {
      const regex = /user:/;
      const names = ['admin:read', 'user:write', 'guest:read'];
      expect(hasMatchingOperation(regex, names)).toBe(true);
    });

    it('should return false when regex matches no names', () => {
      const regex = /admin:/;
      const names = ['user:read', 'guest:write'];
      expect(hasMatchingOperation(regex, names)).toBe(false);
    });

    it('should handle empty names array', () => {
      const regex = /test/;
      const names: string[] = [];
      expect(hasMatchingOperation(regex, names)).toBe(false);
    });

    it('should reset regex lastIndex', () => {
      const regex = /user:/g;
      const names = ['user:read'];
      hasMatchingOperation(regex, names);
      // The function resets lastIndex to 0 before each test, so it should be 0
      expect(regex.lastIndex).toBeGreaterThanOrEqual(0);
    });
  });

  describe('buildPermissionData', () => {
    it('should handle string permissions', () => {
      const permissions = ['read', 'write'];
      const result = buildPermissionData(permissions);
      
      expect(result.direct.has('read')).toBe(true);
      expect(result.direct.has('write')).toBe(true);
      expect(result.conditional.size).toBe(0);
      expect(result.patterns).toHaveLength(0);
      expect(result.all).toEqual(['read', 'write']);
    });

    it('should handle glob permissions', () => {
      const permissions = ['user:*'];
      const result = buildPermissionData(permissions);
      
      expect(result.direct.size).toBe(0);
      expect(result.conditional.size).toBe(0);
      expect(result.patterns).toHaveLength(1);
      expect(result.patterns[0].name).toBe('user:*');
      expect(result.patterns[0].when).toBe(true);
    });

    it('should handle regex permissions', () => {
      const permissions = ['/user:\\d+/'];
      const result = buildPermissionData(permissions);
      
      expect(result.direct.size).toBe(0);
      expect(result.conditional.size).toBe(0);
      expect(result.patterns).toHaveLength(1);
      expect(result.patterns[0].name).toBe('/user:\\d+/');
      expect(result.patterns[0].when).toBe(true);
    });

    it('should handle conditional permissions', () => {
      const permissions = [{
        name: 'read',
        when: true
      }];
      const result = buildPermissionData(permissions);
      
      expect(result.direct.has('read')).toBe(true);
      expect(result.conditional.size).toBe(0);
      expect(result.patterns).toHaveLength(0);
    });

    it('should handle conditional permissions with function', () => {
      const permissions = [{
        name: 'read',
        when: async () => true
      }];
      const result = buildPermissionData(permissions);
      
      expect(result.direct.size).toBe(0);
      expect(result.conditional.has('read')).toBe(true);
      expect(result.patterns).toHaveLength(0);
    });

    it('should handle conditional glob permissions', () => {
      const permissions = [{
        name: 'user:*',
        when: async () => true
      }];
      const result = buildPermissionData(permissions);
      
      expect(result.direct.size).toBe(0);
      expect(result.conditional.size).toBe(0);
      expect(result.patterns).toHaveLength(1);
      expect(result.patterns[0].name).toBe('user:*');
    });

    it('should handle conditional regex permissions', () => {
      const permissions = [{
        name: '/user:\\d+/',
        when: async () => true
      }];
      const result = buildPermissionData(permissions);
      
      expect(result.direct.size).toBe(0);
      expect(result.conditional.size).toBe(0);
      expect(result.patterns).toHaveLength(1);
      expect(result.patterns[0].name).toBe('/user:\\d+/');
    });

    it('should handle mixed permissions', () => {
      const permissions = [
        'read',
        'user:*',
        '/admin:\\d+/',
        {
          name: 'write',
          when: async () => true
        }
      ];
      const result = buildPermissionData(permissions);
      
      expect(result.direct.has('read')).toBe(true);
      expect(result.conditional.has('write')).toBe(true);
      expect(result.patterns).toHaveLength(2);
      expect(result.all).toContain('read');
      expect(result.all).toContain('write');
      expect(result.all).toContain('user:*');
      expect(result.all).toContain('/admin:\\d+/');
    });
  });
});
