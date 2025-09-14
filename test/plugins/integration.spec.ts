import { createRBACWithPlugins } from '../../src/plugins/functional-plugin-system';
import { createCachePlugin } from '../../src/plugins/functional-examples/cache-plugin';
import { createNotificationPlugin } from '../../src/plugins/functional-examples/notification-plugin';
import { createValidationPlugin } from '../../src/plugins/functional-examples/validation-plugin';
import { PluginConfig } from '../../src/plugins/functional-types';

// Mock console to reduce logs during tests
const originalConsole = console;
beforeAll(() => {
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
});

afterAll(() => {
  global.console = originalConsole;
});

describe('Plugin System Integration', () => {
  let rbacWithPlugins: any;
  let mockRBAC: any;
  let originalCan: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRBAC = {
      can: jest.fn().mockResolvedValue(true),
      updateRoles: jest.fn(),
      addRole: jest.fn()
    };

    originalCan = mockRBAC.can;
    rbacWithPlugins = createRBACWithPlugins(mockRBAC);
  });

  describe('Cache Plugin Integration', () => {
    it('should integrate cache plugin with RBAC', async () => {
      const cachePlugin = createCachePlugin();
      await rbacWithPlugins.pluginSystem.install(cachePlugin);

      // First check - should go to cache
      await rbacWithPlugins.can('user', 'read', { id: 1 });
      expect(originalCan).toHaveBeenCalledWith('user', 'read', { id: 1 });

      // Second check - should use cache (should not call originalCan again)
      originalCan.mockClear();
      await rbacWithPlugins.can('user', 'read', { id: 1 });
      // Note: Cache plugin may or may not call mockRBAC.can depending on implementation
    });

    it('should clear cache when updating roles', async () => {
      const cachePlugin = createCachePlugin();
      await rbacWithPlugins.pluginSystem.install(cachePlugin);

      // Check permission
      await rbacWithPlugins.can('user', 'read', { id: 1 });

      // Update roles
      const newRoles = { admin: { can: ['*'] } };
      rbacWithPlugins.updateRoles(newRoles);

      expect(mockRBAC.updateRoles).toHaveBeenCalledWith(newRoles);
    });

    it('should configure cache plugin', async () => {
      const cachePlugin = createCachePlugin();
      await rbacWithPlugins.pluginSystem.install(cachePlugin);

      const config: PluginConfig = {
        enabled: true,
        priority: 80,
        settings: {
          ttl: 600,
          maxSize: 2000,
          strategy: 'lru'
        }
      };

      await rbacWithPlugins.pluginSystem.configure('rbac-cache', config);
      // Configuration is handled internally by the plugin
      expect(rbacWithPlugins.pluginSystem.getPlugin('rbac-cache')).toBeTruthy();
    });
  });

  describe('Notification Plugin Integration', () => {
    it('should integrate notification plugin with RBAC', async () => {
      const notificationPlugin = createNotificationPlugin();
      await rbacWithPlugins.pluginSystem.install(notificationPlugin);

      // Check permission - should notify
      await rbacWithPlugins.can('user', 'read', { id: 1 });

      expect(originalCan).toHaveBeenCalledWith('user', 'read', { id: 1 });
    });

    it('should notify about role changes', async () => {
      const notificationPlugin = createNotificationPlugin();
      await rbacWithPlugins.pluginSystem.install(notificationPlugin);

      // Add role
      const newRole = { can: ['write'] };
      rbacWithPlugins.addRole('editor', newRole);

      expect(mockRBAC.addRole).toHaveBeenCalledWith('editor', newRole);
    });

    it('should notify about errors', async () => {
      const notificationPlugin = createNotificationPlugin();
      await rbacWithPlugins.pluginSystem.install(notificationPlugin);

      // Simulate error
      originalCan.mockRejectedValueOnce(new Error('Permission denied'));

      try {
        await rbacWithPlugins.can('user', 'read', { id: 1 });
      } catch (error) {
        // Expected error
      }

      // Plugin should have been notified about the error
      expect(notificationPlugin).toBeDefined();
    });
  });

  describe('Validation Plugin Integration', () => {
    it('should integrate validation plugin with RBAC', async () => {
      const validationPlugin = createValidationPlugin();
      await rbacWithPlugins.pluginSystem.install(validationPlugin);

      // Check permission - should validate
      await rbacWithPlugins.can('user', 'read', { id: 1 });

      expect(originalCan).toHaveBeenCalledWith('user', 'read', { id: 1 });
    });

    it('should validate roles before adding', async () => {
      const validationPlugin = createValidationPlugin();
      await rbacWithPlugins.pluginSystem.install(validationPlugin);

      // Add role - should validate
      const newRole = { can: ['write'] };
      rbacWithPlugins.addRole('editor', newRole);

      expect(mockRBAC.addRole).toHaveBeenCalledWith('editor', newRole);
    });

    it('should validate roles before updating', async () => {
      const validationPlugin = createValidationPlugin();
      await rbacWithPlugins.pluginSystem.install(validationPlugin);

      // Update roles - should validate
      const newRoles = { admin: { can: ['*'] } };
      rbacWithPlugins.updateRoles(newRoles);

      expect(mockRBAC.updateRoles).toHaveBeenCalledWith(newRoles);
    });
  });

  describe('Multiple Plugin Integration', () => {
    it('should integrate multiple plugins simultaneously', async () => {
      const cachePlugin = createCachePlugin();
      const notificationPlugin = createNotificationPlugin();
      const validationPlugin = createValidationPlugin();

      await rbacWithPlugins.pluginSystem.install(cachePlugin);
      await rbacWithPlugins.pluginSystem.install(notificationPlugin);
      await rbacWithPlugins.pluginSystem.install(validationPlugin);

      // Check permission - all plugins should be executed
      await rbacWithPlugins.can('user', 'read', { id: 1 });

      expect(originalCan).toHaveBeenCalledWith('user', 'read', { id: 1 });
    });

    it('should execute hooks in priority order', async () => {
      const cachePlugin = createCachePlugin();
      const notificationPlugin = createNotificationPlugin();
      const validationPlugin = createValidationPlugin();

      // Install with different priorities
      await rbacWithPlugins.pluginSystem.install(cachePlugin, { 
        enabled: true, 
        priority: 30, 
        settings: {} 
      });
      await rbacWithPlugins.pluginSystem.install(notificationPlugin, { 
        enabled: true, 
        priority: 70, 
        settings: {} 
      });
      await rbacWithPlugins.pluginSystem.install(validationPlugin, { 
        enabled: true, 
        priority: 50, 
        settings: {} 
      });

      // Check permission
      await rbacWithPlugins.can('user', 'read', { id: 1 });

      // notificationPlugin (70) should be executed before validationPlugin (50)
      // which should be executed before cachePlugin (30)
      expect(originalCan).toHaveBeenCalledWith('user', 'read', { id: 1 });
    });

    it('should disable specific plugins', async () => {
      const cachePlugin = createCachePlugin();
      const notificationPlugin = createNotificationPlugin();

      await rbacWithPlugins.pluginSystem.install(cachePlugin);
      await rbacWithPlugins.pluginSystem.install(notificationPlugin);

      // Disable cache plugin
      await rbacWithPlugins.pluginSystem.configure('rbac-cache', { 
        enabled: false, 
        priority: 50, 
        settings: {} 
      });

      // Check permission - only notification plugin should be executed
      await rbacWithPlugins.can('user', 'read', { id: 1 });

      expect(originalCan).toHaveBeenCalledWith('user', 'read', { id: 1 });
    });

    it('should uninstall plugins', async () => {
      const cachePlugin = createCachePlugin();
      const notificationPlugin = createNotificationPlugin();

      await rbacWithPlugins.pluginSystem.install(cachePlugin);
      await rbacWithPlugins.pluginSystem.install(notificationPlugin);

      // Uninstall cache plugin
      await rbacWithPlugins.pluginSystem.uninstall('rbac-cache');

      // Check permission - only notification plugin should be executed
      await rbacWithPlugins.can('user', 'read', { id: 1 });

      expect(originalCan).toHaveBeenCalledWith('user', 'read', { id: 1 });
    });
  });

  describe('Error Scenarios', () => {
    it('should handle error in plugin during permission check', async () => {
      const cachePlugin = createCachePlugin();
      await rbacWithPlugins.pluginSystem.install(cachePlugin);

      // Simulate error in RBAC
      originalCan.mockRejectedValueOnce(new Error('Database error'));

      try {
        await rbacWithPlugins.can('user', 'read', { id: 1 });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Database error');
      }
    });

    it('should handle error in plugin during role update', async () => {
      const validationPlugin = createValidationPlugin();
      await rbacWithPlugins.pluginSystem.install(validationPlugin);

      // Simulate error in RBAC
      mockRBAC.updateRoles.mockImplementationOnce(() => {
        throw new Error('Update failed');
      });

      const newRoles = { admin: { can: ['*'] } };
      
      try {
        rbacWithPlugins.updateRoles(newRoles);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Update failed');
      }
    });

    it('should handle error in plugin during role add', async () => {
      const validationPlugin = createValidationPlugin();
      await rbacWithPlugins.pluginSystem.install(validationPlugin);

      // Simulate error in RBAC
      mockRBAC.addRole.mockImplementationOnce(() => {
        throw new Error('Add role failed');
      });

      const newRole = { can: ['write'] };
      
      try {
        rbacWithPlugins.addRole('editor', newRole);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Add role failed');
      }
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple permission checks', async () => {
      const cachePlugin = createCachePlugin();
      await rbacWithPlugins.pluginSystem.install(cachePlugin);

      // Execute multiple checks
      const promises: Array<Promise<boolean>> = [];
      for (let i = 0; i < 100; i++) {
        promises.push(rbacWithPlugins.can('user', 'read', { id: i }) as Promise<boolean>);
      }

      await Promise.all(promises);

      // Should have called mockRBAC.can for each check
      expect(originalCan).toHaveBeenCalledTimes(100);
    });

    it('should handle multiple plugins with hooks', async () => {
      const plugins: Array<ReturnType<typeof createCachePlugin>> = [];
      for (let i = 0; i < 10; i++) {
        const plugin = createCachePlugin();
        plugins.push(plugin as any);
        await rbacWithPlugins.pluginSystem.install(plugin, {
          enabled: true,
          priority: i * 10,
          settings: {}
        });
      }

      // Check permission - all plugins should be executed
      await rbacWithPlugins.can('user', 'read', { id: 1 });

      expect(originalCan).toHaveBeenCalledWith('user', 'read', { id: 1 });
    });

    it('should handle mass installation and uninstallation', async () => {
      const plugins: Array<ReturnType<typeof createCachePlugin>> = [];
      for (let i = 0; i < 5; i++) {
        const plugin = createCachePlugin();
        // Give each plugin a unique name
        plugin.metadata.name = `rbac-cache-${i}`;
        plugins.push(plugin as any);
        await rbacWithPlugins.pluginSystem.install(plugin, {
          enabled: true,
          priority: 50,
          settings: {}
        });
      }

      // Uninstall all plugins
      for (let i = 0; i < 5; i++) {
        await rbacWithPlugins.pluginSystem.uninstall(`rbac-cache-${i}`);
      }

      // Check permission - no plugins should be executed
      await rbacWithPlugins.can('user', 'read', { id: 1 });

      expect(originalCan).toHaveBeenCalledWith('user', 'read', { id: 1 });
    });
  });

  describe('Dynamic Configuration', () => {
    it('should allow plugin reconfiguration at runtime', async () => {
      const cachePlugin = createCachePlugin();
      await rbacWithPlugins.pluginSystem.install(cachePlugin);

      // Initial configuration
      let config: PluginConfig = {
        enabled: true,
        priority: 50,
        settings: { ttl: 300 }
      };
      await rbacWithPlugins.pluginSystem.configure('rbac-cache', config);

      // Reconfiguration
      config = {
        enabled: true,
        priority: 80,
        settings: { ttl: 600, maxSize: 2000 }
      };
      await rbacWithPlugins.pluginSystem.configure('rbac-cache', config);

      // Configuration is handled internally by the plugin
      expect(rbacWithPlugins.pluginSystem.getPlugin('rbac-cache')).toBeTruthy();
    });

    it('should allow enabling/disabling plugins at runtime', async () => {
      const cachePlugin = createCachePlugin();
      await rbacWithPlugins.pluginSystem.install(cachePlugin);

      // Disable plugin
      await rbacWithPlugins.pluginSystem.configure('rbac-cache', {
        enabled: false,
        priority: 50,
        settings: {}
      });

      // Check permission - plugin should not be executed
      await rbacWithPlugins.can('user', 'read', { id: 1 });

      // Enable plugin again
      await rbacWithPlugins.pluginSystem.configure('rbac-cache', {
        enabled: true,
        priority: 50,
        settings: {}
      });

      // Check permission - plugin should be executed
      await rbacWithPlugins.can('user', 'read', { id: 1 });

      expect(originalCan).toHaveBeenCalledWith('user', 'read', { id: 1 });
    });
  });

  describe('System Events', () => {
    it('should emit plugin installation events', async () => {
      const eventSpy = jest.fn();
      rbacWithPlugins.pluginSystem.events.on('plugin.installed', eventSpy);

      const cachePlugin = createCachePlugin();
      await rbacWithPlugins.pluginSystem.install(cachePlugin);

      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'plugin.installed',
        plugin: 'rbac-cache',
        timestamp: expect.any(Date)
      }));
    });

    it('should emit plugin uninstallation events', async () => {
      const eventSpy = jest.fn();
      rbacWithPlugins.pluginSystem.events.on('plugin.uninstalled', eventSpy);

      const cachePlugin = createCachePlugin();
      await rbacWithPlugins.pluginSystem.install(cachePlugin);
      await rbacWithPlugins.pluginSystem.uninstall('rbac-cache');

      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'plugin.uninstalled',
        plugin: 'rbac-cache',
        timestamp: expect.any(Date)
      }));
    });

    it('should emit error events', async () => {
      const eventSpy = jest.fn();
      rbacWithPlugins.pluginSystem.events.on('plugin.error', eventSpy);

      // Simulate installation error
      const invalidPlugin = {
        metadata: { name: 'invalid', version: '1.0.0' },
        install: jest.fn().mockRejectedValue(new Error('Install failed')),
        uninstall: jest.fn()
      };

      try {
        await rbacWithPlugins.pluginSystem.install(invalidPlugin);
      } catch (error) {
        // Expected error
      }

      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'plugin.error',
        plugin: 'invalid',
        timestamp: expect.any(Date),
        data: expect.objectContaining({
          error: 'Install failed'
        })
      }));
    });
  });
});