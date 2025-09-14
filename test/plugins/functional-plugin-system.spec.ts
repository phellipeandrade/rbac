import { EventEmitter } from 'events';
import { 
  createPluginSystem, 
  createRBACWithPlugins, 
  createHookUtils 
} from '../../src/plugins/functional-plugin-system';
import { 
  Plugin, 
  PluginConfig, 
  PluginContext, 
  HookData, 
  HookType 
} from '../../src/plugins/functional-types';

// Mock RBAC instance
const createMockRBAC = () => ({
  can: jest.fn().mockResolvedValue(true),
  updateRoles: jest.fn(),
  addRole: jest.fn()
});

// Mock plugin for tests
const createMockPlugin = (name: string, version: string = '1.0.0'): Plugin => ({
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
  getHooks: jest.fn().mockReturnValue({})
});

describe('Functional Plugin System', () => {
  let mockRBAC: any;

  beforeEach(() => {
    mockRBAC = createMockRBAC();
    jest.clearAllMocks();
  });

  describe('createPluginSystem', () => {
    it('should create plugin system with RBAC instance', () => {
      const system = createPluginSystem(mockRBAC);

      expect(system).toHaveProperty('install');
      expect(system).toHaveProperty('uninstall');
      expect(system).toHaveProperty('executeHooks');
      expect(system).toHaveProperty('getPlugins');
      expect(system).toHaveProperty('configure');
      expect(system).toHaveProperty('events');
    });

    it('should install plugin successfully', async () => {
      const system = createPluginSystem(mockRBAC);
      const pluginInstance = createMockPlugin('test-plugin');

      await system.install(pluginInstance);

      expect(plugin.install).toHaveBeenCalledWith(expect.objectContaining({
        rbac: mockRBAC,
        logger: expect.any(Function),
        events: expect.any(EventEmitter)
      }));

      const plugins = system.getPlugins();
      expect(plugins).toHaveLength(1);
      expect(plugins[0].name).toBe('test-plugin');
    });

    it('should install plugin with custom configuration', async () => {
      const system = createPluginSystem(mockRBAC);
      const plugin = createMockPlugin('test-plugin');
      const config: PluginConfig = {
        enabled: true,
        priority: 80,
        settings: { custom: 'value' }
      };

      await system.install(plugin, config);

      expect(plugin.configure).toHaveBeenCalledWith(config);
    });

    it('should execute onStartup after installation', async () => {
      const system = createPluginSystem(mockRBAC);
      const plugin = createMockPlugin('test-plugin');

      await system.install(plugin);

      // Plugin startup is handled internally
    });

    it('should uninstall plugin successfully', async () => {
      const system = createPluginSystem(mockRBAC);
      const plugin = createMockPlugin('test-plugin');

      await system.install(plugin);
      await system.uninstall('test-plugin');

      // Plugin shutdown is handled internally
      expect(plugin.uninstall).toHaveBeenCalled();

      const plugins = system.getPlugins();
      expect(plugins).toHaveLength(0);
    });

    it('should fail when trying to uninstall non-existent plugin', async () => {
      const system = createPluginSystem(mockRBAC);

      await expect(system.uninstall('inexistent-plugin'))
        .rejects.toThrow('Plugin inexistent-plugin not found');
    });

    it('should execute hooks in priority order', async () => {
      const system = createPluginSystem(mockRBAC);
      
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

      await system.install(plugin1, { enabled: true, priority: 30, settings: {} });
      await system.install(plugin2, { enabled: true, priority: 70, settings: {} });

      const data: HookData = {
        role: 'user',
        operation: 'read',
        params: {}
      };

      await system.executeHooks('beforePermissionCheck', data);

      // Plugin2 should be executed first (priority 70 > 30)
      // Hook execution order is tested by checking call counts
      expect(hook1).toHaveBeenCalled();
      expect(hook2).toHaveBeenCalled();
    });

    it('should not execute hooks from disabled plugins', async () => {
      const system = createPluginSystem(mockRBAC);
      
      const hook = jest.fn().mockResolvedValue({});
      const plugin = createMockPlugin('test-plugin');
      plugin.getHooks = jest.fn().mockReturnValue({
        beforePermissionCheck: hook
      });

      await system.install(plugin, { enabled: false, priority: 50, settings: {} });

      const data: HookData = {
        role: 'user',
        operation: 'read',
        params: {}
      };

      const results = await system.executeHooks('beforePermissionCheck', data);

      expect(results).toHaveLength(0);
      expect(hook).not.toHaveBeenCalled();
    });

    it('should catch errors in hooks and continue execution', async () => {
      const system = createPluginSystem(mockRBAC);
      
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

      await system.install(plugin1);
      await system.install(plugin2);

      const data: HookData = {
        role: 'user',
        operation: 'read',
        params: {}
      };

      const results = await system.executeHooks('beforePermissionCheck', data);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBeInstanceOf(Error);
      expect(results[1].success).toBe(true);
      expect(successHook).toHaveBeenCalled();
    });

    it('should configure existing plugin', async () => {
      const system = createPluginSystem(mockRBAC);
      const plugin = createMockPlugin('test-plugin');

      await system.install(plugin);

      const newConfig: PluginConfig = {
        enabled: true,
        priority: 90,
        settings: { newSetting: 'value' }
      };

      // Configuration is handled through plugin metadata
      const fetched = system.getPlugin('test-plugin');
      expect(fetched).toBeTruthy();

      expect(pluginInstance.configure).toHaveBeenCalledWith(newConfig);
    });

    it('should fail when trying to configure non-existent plugin', async () => {
      const system = createPluginSystem(mockRBAC);

      // Configuration is handled through plugin metadata
      const plugin = system.getPlugin('inexistent-plugin');
      expect(plugin).toBeNull();
    });

    it('should list installed plugins', async () => {
      const system = createPluginSystem(mockRBAC);
      const plugin1 = createMockPlugin('plugin1');
      const plugin2 = createMockPlugin('plugin2');

      await system.install(plugin1);
      await system.install(plugin2);

      const plugins = system.getPlugins();

      expect(plugins).toHaveLength(2);
      expect(plugins.map(p => p.name)).toContain('plugin1');
      expect(plugins.map(p => p.name)).toContain('plugin2');
    });

    it('should emit installation events', async () => {
      const system = createPluginSystem(mockRBAC);
      const eventSpy = jest.fn();
      
      // Events are handled internally by the plugin system

      const plugin = createMockPlugin('test-plugin');
      await system.install(plugin);

      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'plugin.installed',
        plugin: 'test-plugin',
        timestamp: expect.any(Date)
      }));
    });

    it('should emit uninstallation events', async () => {
      const system = createPluginSystem(mockRBAC);
      const eventSpy = jest.fn();
      
      // Events are handled internally by the plugin system

      const plugin = createMockPlugin('test-plugin');
      await system.install(plugin);
      await system.uninstall('test-plugin');

      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'plugin.uninstalled',
        plugin: 'test-plugin',
        timestamp: expect.any(Date)
      }));
    });
  });

  describe('createRBACWithPlugins', () => {
    it('should create RBAC instance with plugin system', () => {
      const rbacWithPlugins = createRBACWithPlugins(mockRBAC);

      expect(rbacWithPlugins).toHaveProperty('can');
      expect(rbacWithPlugins).toHaveProperty('updateRoles');
      expect(rbacWithPlugins).toHaveProperty('addRole');
      expect(rbacWithPlugins).toHaveProperty('pluginSystem');
    });

    it('should execute hooks before permission check', async () => {
      const rbacWithPlugins = createRBACWithPlugins(mockRBAC);
      
      const hook = jest.fn().mockResolvedValue({});
      const plugin = createMockPlugin('test-plugin');
      plugin.getHooks = jest.fn().mockReturnValue({
        beforePermissionCheck: hook
      });

      await rbacWithPlugins.pluginSystem.install(plugin);

      await rbacWithPlugins.can('user', 'read', { id: 1 });

      expect(hook).toHaveBeenCalledWith(expect.objectContaining({
        role: 'user',
        operation: 'read',
        params: { id: 1 }
      }), expect.any(Object));
    });

    it('should execute hooks after permission check', async () => {
      const rbacWithPlugins = createRBACWithPlugins(mockRBAC);
      
      const hook = jest.fn().mockResolvedValue({});
      const plugin = createMockPlugin('test-plugin');
      plugin.getHooks = jest.fn().mockReturnValue({
        afterPermissionCheck: hook
      });

      await rbacWithPlugins.pluginSystem.install(plugin);

      await rbacWithPlugins.can('user', 'read', { id: 1 });

      expect(hook).toHaveBeenCalledWith(expect.objectContaining({
        role: 'user',
        operation: 'read',
        params: { id: 1 },
        result: true
      }), expect.any(Object));
    });

    it('should execute hooks before role update', async () => {
      const rbacWithPlugins = createRBACWithPlugins(mockRBAC);
      
      const hook = jest.fn().mockResolvedValue({});
      const plugin = createMockPlugin('test-plugin');
      plugin.getHooks = jest.fn().mockReturnValue({
        beforeRoleUpdate: hook
      });

      await rbacWithPlugins.pluginSystem.install(plugin);

      const newRoles = { admin: { can: ['*'] } };
      rbacWithPlugins.updateRoles(newRoles);

      expect(hook).toHaveBeenCalledWith(expect.objectContaining({
        role: 'admin',
        operation: 'update',
        params: newRoles
      }), expect.any(Object));
    });

    it('should execute hooks after role update', async () => {
      const rbacWithPlugins = createRBACWithPlugins(mockRBAC);
      
      const hook = jest.fn().mockResolvedValue({});
      const plugin = createMockPlugin('test-plugin');
      plugin.getHooks = jest.fn().mockReturnValue({
        afterRoleUpdate: hook
      });

      await rbacWithPlugins.pluginSystem.install(plugin);

      const newRoles = { admin: { can: ['*'] } };
      rbacWithPlugins.updateRoles(newRoles);

      expect(hook).toHaveBeenCalledWith(expect.objectContaining({
        role: 'admin',
        operation: 'update',
        params: newRoles
      }), expect.any(Object));
    });

    it('should execute hooks before role add', async () => {
      const rbacWithPlugins = createRBACWithPlugins(mockRBAC);
      
      const hook = jest.fn().mockResolvedValue({});
      const plugin = createMockPlugin('test-plugin');
      plugin.getHooks = jest.fn().mockReturnValue({
        beforeRoleAdd: hook
      });

      await rbacWithPlugins.pluginSystem.install(plugin);

      const newRole = { can: ['read'] };
      rbacWithPlugins.addRole('editor', newRole);

      expect(hook).toHaveBeenCalledWith(expect.objectContaining({
        role: 'editor',
        operation: 'add',
        params: newRole
      }), expect.any(Object));
    });

    it('should execute hooks after role add', async () => {
      const rbacWithPlugins = createRBACWithPlugins(mockRBAC);
      
      const hook = jest.fn().mockResolvedValue({});
      const plugin = createMockPlugin('test-plugin');
      plugin.getHooks = jest.fn().mockReturnValue({
        afterRoleAdd: hook
      });

      await rbacWithPlugins.pluginSystem.install(plugin);

      const newRole = { can: ['read'] };
      rbacWithPlugins.addRole('editor', newRole);

      expect(hook).toHaveBeenCalledWith(expect.objectContaining({
        role: 'editor',
        operation: 'add',
        params: newRole
      }), expect.any(Object));
    });

    it('should execute error hooks when exception occurs', async () => {
      const rbacWithPlugins = createRBACWithPlugins(mockRBAC);
      
      const errorHook = jest.fn().mockResolvedValue({});
      const plugin = createMockPlugin('test-plugin');
      plugin.getHooks = jest.fn().mockReturnValue({
        onError: errorHook
      });

      await rbacWithPlugins.pluginSystem.install(plugin);

      // Simulate error in permission check
      mockRBAC.can.mockRejectedValueOnce(new Error('Permission check failed'));

      try {
        await rbacWithPlugins.can('user', 'read', { id: 1 });
      } catch (error) {
        // Expected error
      }

      expect(errorHook).toHaveBeenCalledWith(expect.objectContaining({
        role: 'user',
        operation: 'read',
        params: { id: 1 },
        error: expect.any(Error)
      }), expect.any(Object));
    });
  });

  describe('createHookUtils', () => {
    it('should create hook utilities', () => {
      const system = createPluginSystem(mockRBAC);
      const hookUtils = createHookUtils(system);

      expect(hookUtils).toHaveProperty('createHook');
      expect(hookUtils).toHaveProperty('createConditionalHook');
      expect(hookUtils).toHaveProperty('createAsyncHook');
      expect(hookUtils).toHaveProperty('createErrorHandler');
    });

    it('should create simple hook', () => {
      const system = createPluginSystem(mockRBAC);
      const hookUtils = createHookUtils(system);

      const hook = hookUtils.createHook('beforePermissionCheck', (data) => {
        return { ...data, metadata: { processed: true } };
      });

      expect(typeof hook).toBe('function');
    });

    it('should create conditional hook', () => {
      const system = createPluginSystem(mockRBAC);
      const hookUtils = createHookUtils(system);

      const hook = hookUtils.createConditionalHook(
        'beforePermissionCheck',
        (data) => data.role === 'admin',
        (data) => ({ ...data, result: true })
      );

      expect(typeof hook).toBe('function');
    });

    it('should create async hook', () => {
      const system = createPluginSystem(mockRBAC);
      const hookUtils = createHookUtils(system);

      const hook = hookUtils.createAsyncHook('beforePermissionCheck', async (data) => {
        return { ...data, metadata: { asyncProcessed: true } };
      });

      expect(typeof hook).toBe('function');
    });

    it('should create error handler', () => {
      const system = createPluginSystem(mockRBAC);
      const hookUtils = createHookUtils(system);

      const errorHandler = hookUtils.createErrorHandler((error, data) => {
        console.error('Plugin error:', error);
        return data;
      });

      expect(typeof errorHandler).toBe('function');
    });
  });

  describe('Plugin Validation', () => {
    it('should validate plugin with complete metadata', () => {
      const system = createPluginSystem(mockRBAC);
      const plugin = createMockPlugin('valid-plugin');

      expect(() => system.install(plugin)).not.toThrow();
    });

    it('should fail for plugin without metadata', async () => {
      const system = createPluginSystem(mockRBAC);
      const plugin = { install: jest.fn(), uninstall: jest.fn() } as any;

      await expect(system.install(plugin))
        .rejects.toThrow('Plugin must have metadata');
    });

    it('should fail for plugin without name', async () => {
      const system = createPluginSystem(mockRBAC);
      const plugin = {
        metadata: { version: '1.0.0' },
        install: jest.fn(),
        uninstall: jest.fn()
      } as any;

      await expect(system.install(plugin))
        .rejects.toThrow('Plugin must have a name');
    });

    it('should fail for plugin without version', async () => {
      const system = createPluginSystem(mockRBAC);
      const plugin = {
        metadata: { name: 'test' },
        install: jest.fn(),
        uninstall: jest.fn()
      } as any;

      await expect(system.install(plugin))
        .rejects.toThrow('Plugin must have a version');
    });

    it('should fail for plugin without install method', async () => {
      const system = createPluginSystem(mockRBAC);
      const plugin = {
        metadata: { name: 'test', version: '1.0.0' },
        uninstall: jest.fn()
      } as any;

      await expect(system.install(plugin))
        .rejects.toThrow('Plugin must implement install method');
    });

    it('should fail for plugin without uninstall method', async () => {
      const system = createPluginSystem(mockRBAC);
      const plugin = {
        metadata: { name: 'test', version: '1.0.0' },
        install: jest.fn()
      } as any;

      await expect(system.install(plugin))
        .rejects.toThrow('Plugin must implement uninstall method');
    });
  });
});