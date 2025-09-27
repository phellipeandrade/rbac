import { describe, expect, it } from '@jest/globals';

describe('adapters/index', () => {
  it('should export all adapter modules', async () => {
    const adapters = await import('../src/adapters');
    
    // Check that all expected exports are available
    expect(adapters).toHaveProperty('MongoRoleAdapter');
    expect(adapters).toHaveProperty('MySQLRoleAdapter');
    expect(adapters).toHaveProperty('PostgresRoleAdapter');
    
    // Verify they are functions/classes
    expect(typeof adapters.MongoRoleAdapter).toBe('function');
    expect(typeof adapters.MySQLRoleAdapter).toBe('function');
    expect(typeof adapters.PostgresRoleAdapter).toBe('function');
  });

  it('should have proper exports structure', async () => {
    const adapters = await import('../src/adapters');
    
    // Verify that the exports are constructors
    expect(() => new adapters.MongoRoleAdapter({} as any)).toThrow();
    expect(() => new adapters.MySQLRoleAdapter({} as any)).not.toThrow();
    expect(() => new adapters.PostgresRoleAdapter({} as any)).toThrow();
  });
});
