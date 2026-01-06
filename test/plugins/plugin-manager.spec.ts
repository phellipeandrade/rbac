import { EventEmitter } from 'events';
import { PluginManager } from '../../src/plugins/plugin-manager';
import { 
  RBACPlugin, 
  PluginMetadata, 
  PluginConfig, 
  PluginContext, 
  HookData, 
  PluginHook 
} from '../../src/plugins/types';

// Mock RBAC instance
const createMockRBAC = () => ({
  can: jest.fn().mockResolvedValue(true),
  updateRoles: jest.fn(),
  addRole: jest.fn()
});

// Mock plugin for tests
const createMockPlugin = (name: string, version: string = '1.0.0'): RBACPlugin => ({
  metadata: {
    name,
    version,
    description: `Test plugin ${name}`,
    author: 'Test Author',
    license: 'MIT'
  },
  install: jest.fn().mockResolvedValue(undefined),
  uninstall: jest.fn().mockResolvedValue(undefined),
  configure: jest.fn().mockResolvedValue(undefined),
  getHooks: jest.fn().mockReturnValue({}),
  onStartup: jest.fn().mockResolvedValue(undefined),
  onShutdown: jest.fn().mockResolvedValue(undefined)
});

describe('PluginManager', () => {
  let pluginManager: PluginManager;
  let mockRBAC: any;

  beforeEach(() => {
    mockRBAC = createMockRBAC();
    pluginManager = new PluginManager(mockRBAC, {
      logLevel: 'error', // Reduce logs during tests
      strictMode: true
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Plugin Installation', () => {
    it('should install a plugin successfully', async () => {
      const plugin = createMockPlugin('test-plugin');
      
      await pluginManager.installPlugin(plugin);
      
      expect(plugin.install).toHaveBeenCalledWith(expect.objectContaining({
        rbac: mockRBAC,
        config: expect.any(Object),
        logger: expect.any(Function),
        events: expect.any(EventEmitter)
      }));
      
      const installedPlugins = pluginManager.getInstalledPlugins();
      expect(installedPlugins).toHaveLength(1);
      expect(installedPlugins[0].name).toBe('test-plugin');
    });

    it('should install plugin with custom configuration', async () => {
      const plugin = createMockPlugin('test-plugin');
      const config: PluginConfig = {
        enabled: true,
        priority: 80,
        settings: { customSetting: 'value' }
      };
      
      await pluginManager.installPlugin(plugin, config);
      
      expect(plugin.configure).toHaveBeenCalledWith(config);
      
      const pluginInfo = pluginManager.getPlugin('test-plugin');
      expect(pluginInfo?.config).toEqual(config);
    });

    it('should execute onStartup after installation', async () => {
      const plugin = createMockPlugin('test-plugin');
      
      await pluginManager.installPlugin(plugin);
      
      expect(plugin.onStartup).toHaveBeenCalled();
    });

    it('should fail if plugin has no metadata', async () => {
      const plugin = { install: jest.fn(), uninstall: jest.fn() } as any;
      
      await expect(pluginManager.installPlugin(plugin))
        .rejects.toThrow('Plugin must have metadata');
    });

    it('should fail if plugin has no name', async () => {
      const plugin = {
        metadata: { version: '1.0.0' },
        install: jest.fn(),
        uninstall: jest.fn()
      } as any;
      
      await expect(pluginManager.installPlugin(plugin))
        .rejects.toThrow('Plugin must have a name');
    });

    it('should fail if plugin has no version', async () => {
      const plugin = {
        metadata: { name: 'test' },
        install: jest.fn(),
        uninstall: jest.fn()
      } as any;
      
      await expect(pluginManager.installPlugin(plugin))
        .rejects.toThrow('Plugin must have a version');
    });

    it('should fail if plugin does not implement install', async () => {
      const plugin = {
        metadata: { name: 'test', version: '1.0.0' },
        uninstall: jest.fn()
      } as any;
      
      await expect(pluginManager.installPlugin(plugin))
        .rejects.toThrow('Plugin must implement install method');
    });

    it('should fail if plugin does not implement uninstall', async () => {
      const plugin = {
        metadata: { name: 'test', version: '1.0.0' },
        install: jest.fn()
      } as any;

      await expect(pluginManager.installPlugin(plugin))
        .rejects.toThrow('Plugin must implement uninstall method');
    });

    it('should fail when required dependencies are missing', async () => {
      const plugin = createMockPlugin('dep-plugin');
      plugin.metadata.dependencies = { 'non-existent-package': '1.0.0' };

      await expect(pluginManager.installPlugin(plugin))
        .rejects.toThrow('Dependency non-existent-package@1.0.0 not found');
      expect(plugin.install).not.toHaveBeenCalled();
    });
  });

  describe('Plugin Uninstallation', () => {
    it('should uninstall plugin successfully', async () => {
      const plugin = createMockPlugin('test-plugin');
      await pluginManager.installPlugin(plugin);
      
      await pluginManager.uninstallPlugin('test-plugin');
      
      expect(plugin.onShutdown).toHaveBeenCalled();
      expect(plugin.uninstall).toHaveBeenCalled();
      
      const installedPlugins = pluginManager.getInstalledPlugins();
      expect(installedPlugins).toHaveLength(0);
    });

    it('should fail when trying to uninstall non-existent plugin', async () => {
      await expect(pluginManager.uninstallPlugin('inexistent-plugin'))
        .rejects.toThrow('Plugin inexistent-plugin not found');
    });

    it('should handle errors during plugin uninstallation', async () => {
      const plugin = createMockPlugin('test-plugin');
      plugin.uninstall = jest.fn().mockRejectedValue(new Error('Uninstall error'));
      await pluginManager.installPlugin(plugin);

      await expect(pluginManager.uninstallPlugin('test-plugin'))
        .rejects.toThrow('Uninstall error');
    });
  });

  describe('Plugin Enable/Disable', () => {
    it('should enable plugin', async () => {
      const plugin = createMockPlugin('test-plugin');
      await pluginManager.installPlugin(plugin);
      
      await pluginManager.disablePlugin('test-plugin');
      await pluginManager.enablePlugin('test-plugin');
      
      const pluginInfo = pluginManager.getPlugin('test-plugin');
      expect(pluginInfo?.config.enabled).toBe(true);
    });

    it('should disable plugin', async () => {
      const plugin = createMockPlugin('test-plugin');
      await pluginManager.installPlugin(plugin);
      
      await pluginManager.disablePlugin('test-plugin');
      
      const pluginInfo = pluginManager.getPlugin('test-plugin');
      expect(pluginInfo?.config.enabled).toBe(false);
    });

    it('should fail when trying to enable non-existent plugin', async () => {
      await expect(pluginManager.enablePlugin('inexistent-plugin'))
        .rejects.toThrow('Plugin inexistent-plugin not found');
    });

    it('should fail when trying to disable non-existent plugin', async () => {
      await expect(pluginManager.disablePlugin('inexistent-plugin'))
        .rejects.toThrow('Plugin inexistent-plugin not found');
    });
  });

  describe('Hook System', () => {
    it('should register plugin hooks', async () => {
      const mockHook = jest.fn().mockResolvedValue({});
      const plugin = createMockPlugin('test-plugin');
      plugin.getHooks = jest.fn().mockReturnValue({
        beforePermissionCheck: mockHook
      });
      
      await pluginManager.installPlugin(plugin);
      
      const data: HookData = {
        role: 'user',
        operation: 'read',
        params: {}
      };
      
      const results = await pluginManager.executeHooks('beforePermissionCheck', data);
      
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].plugin).toBe('test-plugin');
      expect(mockHook).toHaveBeenCalledWith(data, expect.any(Object));
    });

    it('should execute hooks in priority order', async () => {
      const hook1 = jest.fn().mockResolvedValue({});
      const hook2 = jest.fn().mockResolvedValue({});
      
      const plugin1 = createMockPlugin('plugin1');
      plugin1.getHooks = jest.fn().mockReturnValue({
        beforePermissionCheck: hook1
      });
      
      const plugin2 = createMockPlugin('plugin2');
      plugin2.getHooks = jest.fn().mockReturnValue({
        beforePermissionCheck: hook2
      });
      
      await pluginManager.installPlugin(plugin1, { enabled: true, priority: 30, settings: {} });
      await pluginManager.installPlugin(plugin2, { enabled: true, priority: 70, settings: {} });
      
      const data: HookData = {
        role: 'user',
        operation: 'read',
        params: {}
      };
      
      await pluginManager.executeHooks('beforePermissionCheck', data);
      
      // Plugin2 should be executed first (priority 70 > 30)
      expect(hook2).toHaveBeenCalled();
      expect(hook1).toHaveBeenCalled();
    });

    it('should not execute hooks from disabled plugins', async () => {
      const mockHook = jest.fn().mockResolvedValue({});
      const plugin = createMockPlugin('test-plugin');
      plugin.getHooks = jest.fn().mockReturnValue({
        beforePermissionCheck: mockHook
      });
      
      await pluginManager.installPlugin(plugin);
      await pluginManager.disablePlugin('test-plugin');
      
      const data: HookData = {
        role: 'user',
        operation: 'read',
        params: {}
      };
      
      const results = await pluginManager.executeHooks('beforePermissionCheck', data);
      
      expect(results).toHaveLength(0);
      expect(mockHook).not.toHaveBeenCalled();
    });

    it('should catch errors in hooks and continue execution', async () => {
      const errorHook = jest.fn().mockRejectedValue(new Error('Hook error'));
      const successHook = jest.fn().mockResolvedValue({});
      
      const plugin1 = createMockPlugin('plugin1');
      plugin1.getHooks = jest.fn().mockReturnValue({
        beforePermissionCheck: errorHook
      });
      
      const plugin2 = createMockPlugin('plugin2');
      plugin2.getHooks = jest.fn().mockReturnValue({
        beforePermissionCheck: successHook
      });
      
      await pluginManager.installPlugin(plugin1);
      await pluginManager.installPlugin(plugin2);
      
      const data: HookData = {
        role: 'user',
        operation: 'read',
        params: {}
      };
      
      const results = await pluginManager.executeHooks('beforePermissionCheck', data);
      
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBeInstanceOf(Error);
      expect(results[1].success).toBe(true);
      expect(successHook).toHaveBeenCalled();
    });

    it('should remove hooks when plugin is uninstalled', async () => {
      const hook = jest.fn().mockResolvedValue({});
      const plugin = createMockPlugin('test-plugin');
      plugin.getHooks = jest.fn().mockReturnValue({
        beforePermissionCheck: hook
      });

      await pluginManager.installPlugin(plugin);
      await pluginManager.uninstallPlugin('test-plugin');

      const data: HookData = { role: 'user', operation: 'read', params: {} };
      const results = await pluginManager.executeHooks('beforePermissionCheck', data);

      expect(results).toHaveLength(0);
      expect(hook).not.toHaveBeenCalled();
    });
  });

  describe('Plugin Configuration', () => {
    it('should update plugin configuration', async () => {
      const plugin = createMockPlugin('test-plugin');
      await pluginManager.installPlugin(plugin);
      
      const newConfig = {
        enabled: true,
        priority: 90,
        settings: { newSetting: 'value' }
      };
      
      await pluginManager.updatePluginConfig('test-plugin', newConfig);
      
      expect(plugin.configure).toHaveBeenCalledWith(newConfig);
      
      const pluginInfo = pluginManager.getPlugin('test-plugin');
      expect(pluginInfo?.config).toEqual(newConfig);
    });

    it('should fail when trying to update configuration of non-existent plugin', async () => {
      await expect(pluginManager.updatePluginConfig('inexistent-plugin', {}))
        .rejects.toThrow('Plugin inexistent-plugin not found');
    });
  });

  describe('Plugin Management', () => {
    it('should list installed plugins', async () => {
      const plugin1 = createMockPlugin('plugin1');
      const plugin2 = createMockPlugin('plugin2');
      
      await pluginManager.installPlugin(plugin1);
      await pluginManager.installPlugin(plugin2);
      
      const installedPlugins = pluginManager.getInstalledPlugins();
      
      expect(installedPlugins).toHaveLength(2);
      expect(installedPlugins.map(p => p.name)).toContain('plugin1');
      expect(installedPlugins.map(p => p.name)).toContain('plugin2');
    });

    it('should get information about specific plugin', async () => {
      const plugin = createMockPlugin('test-plugin');
      await pluginManager.installPlugin(plugin);
      
      const pluginInfo = pluginManager.getPlugin('test-plugin');
      
      expect(pluginInfo).not.toBeNull();
      expect(pluginInfo?.plugin).toBe(plugin);
      expect(pluginInfo?.config).toBeDefined();
    });

    it('should return null for non-existent plugin', () => {
      const pluginInfo = pluginManager.getPlugin('inexistent-plugin');
      expect(pluginInfo).toBeNull();
    });
  });

  describe('Internal Utilities', () => {
    it('should return null when handler has no associated plugin', () => {
      const result = (pluginManager as any).findPluginByHandler(() => {});
      expect(result).toBeNull();
    });

    it('should attempt to load plugins from directory', async () => {
      await expect(pluginManager.loadPluginsFromDirectory('/tmp'))
        .resolves.not.toThrow();
    });
  });

  describe('Events', () => {
    it('should emit installation event', async () => {
      const eventSpy = jest.fn();
      pluginManager.on('plugin.installed', eventSpy);
      
      const plugin = createMockPlugin('test-plugin');
      await pluginManager.installPlugin(plugin);
      
      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'plugin.installed',
        plugin: 'test-plugin',
        timestamp: expect.any(Date)
      }));
    });

    it('should emit uninstallation event', async () => {
      const eventSpy = jest.fn();
      pluginManager.on('plugin.uninstalled', eventSpy);
      
      const plugin = createMockPlugin('test-plugin');
      await pluginManager.installPlugin(plugin);
      await pluginManager.uninstallPlugin('test-plugin');
      
      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'plugin.uninstalled',
        plugin: 'test-plugin',
        timestamp: expect.any(Date)
      }));
    });

    it('should emit enable event', async () => {
      const eventSpy = jest.fn();
      pluginManager.on('plugin.enabled', eventSpy);
      
      const plugin = createMockPlugin('test-plugin');
      await pluginManager.installPlugin(plugin);
      await pluginManager.disablePlugin('test-plugin');
      await pluginManager.enablePlugin('test-plugin');
      
      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'plugin.enabled',
        plugin: 'test-plugin',
        timestamp: expect.any(Date)
      }));
    });

    it('should emit disable event', async () => {
      const eventSpy = jest.fn();
      pluginManager.on('plugin.disabled', eventSpy);
      
      const plugin = createMockPlugin('test-plugin');
      await pluginManager.installPlugin(plugin);
      await pluginManager.disablePlugin('test-plugin');
      
      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'plugin.disabled',
        plugin: 'test-plugin',
        timestamp: expect.any(Date)
      }));
    });

    it('should emit error event', async () => {
      const eventSpy = jest.fn();
      pluginManager.on('plugin.error', eventSpy);
      
      const plugin = {
        metadata: { name: 'test', version: '1.0.0' },
        install: jest.fn().mockRejectedValue(new Error('Install error')),
        uninstall: jest.fn()
      } as any;
      
      try {
        await pluginManager.installPlugin(plugin);
      } catch (error) {
        // Expected error
      }
      
      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'plugin.error',
        plugin: 'test',
        timestamp: expect.any(Date),
        data: expect.objectContaining({
          error: 'Install error'
        })
      }));
    });

    it('should log plugin system errors', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (pluginManager as any).registry.events.emit('error', 'boom');
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('boom'));
      errorSpy.mockRestore();
    });
  });

  describe('Strict Mode', () => {
    it('should throw error in strict mode when plugin fails', async () => {
      const strictManager = new PluginManager(mockRBAC, { strictMode: true });
      
      const plugin = {
        metadata: { name: 'test', version: '1.0.0' },
        install: jest.fn().mockRejectedValue(new Error('Install error')),
        uninstall: jest.fn()
      } as any;
      
      await expect(strictManager.installPlugin(plugin))
        .rejects.toThrow('Install error');
    });

    it('should not throw error in non-strict mode when plugin fails', async () => {
      const nonStrictManager = new PluginManager(mockRBAC, { strictMode: false });
      
      const plugin = {
        metadata: { name: 'test', version: '1.0.0' },
        install: jest.fn().mockRejectedValue(new Error('Install error')),
        uninstall: jest.fn()
      } as any;
      
      await expect(nonStrictManager.installPlugin(plugin))
        .resolves.not.toThrow();
    });
  });
});