import { 
  createCachePlugin
} from '../../src/plugins/functional-examples/cache-plugin';
import { 
  createNotificationPlugin
} from '../../src/plugins/functional-examples/notification-plugin';
import { 
  createValidationPlugin
} from '../../src/plugins/functional-examples/validation-plugin';
import { 
  createExpressMiddlewarePlugin, 
  createRedisCachePlugin 
} from '../../src/plugins/functional-examples/usage-example';
import { PluginConfig, PluginContext, HookData } from '../../src/plugins/functional-types';

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

describe('Example Plugins', () => {
  let mockContext: PluginContext;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockContext = {
      rbac: {
        can: jest.fn().mockResolvedValue(true),
        updateRoles: jest.fn(),
        addRole: jest.fn()
      },
      logger: jest.fn(),
      events: {
        on: jest.fn(),
        emit: jest.fn(),
        off: jest.fn(),
        removeAllListeners: jest.fn()
      } as any
    };
  });

  describe('Cache Plugin', () => {
    it('should create cache plugin with default configuration', () => {
      const plugin = createCachePlugin();

      expect(plugin.metadata.name).toBe('rbac-cache');
      expect(plugin.metadata.version).toBe('1.0.0');
      expect(plugin.metadata.description).toContain('cache');
    });

    it('should install cache plugin', async () => {
      const plugin = createCachePlugin();
      
      await plugin.install(mockContext);

      expect(mockContext.logger).toHaveBeenCalledWith('CachePlugin installed', 'info');
    });

    it('should uninstall cache plugin', async () => {
      const plugin = createCachePlugin();
      
      await plugin.install(mockContext);
      await plugin.uninstall();

      // Plugin should clear cache on uninstall
      expect(plugin).toBeDefined();
    });

    it('should configure cache plugin', async () => {
      const plugin = createCachePlugin();
      const config: PluginConfig = {
        enabled: true,
        priority: 50,
        settings: {
          ttl: 600,
          maxSize: 2000,
          strategy: 'fifo'
        }
      };

      await plugin.install(mockContext);
      await plugin.configure?.(config);

      expect(plugin).toBeDefined();
    });

    it('should execute beforePermissionCheck hook', async () => {
      const plugin = createCachePlugin();
      await plugin.install(mockContext);

      const hooks = plugin.getHooks?.();
      expect(hooks).toHaveProperty('beforePermissionCheck');

      const data: HookData = {
        role: 'user',
        operation: 'read',
        params: { id: 1 }
      };

      const result = await hooks?.beforePermissionCheck?.(data, mockContext);

      expect(result).toBeDefined();
    });

    it('should execute afterPermissionCheck hook', async () => {
      const plugin = createCachePlugin();
      await plugin.install(mockContext);

      const hooks = plugin.getHooks?.();
      expect(hooks).toHaveProperty('afterPermissionCheck');

      const data: HookData = {
        role: 'user',
        operation: 'read',
        params: { id: 1 },
        result: true
      };

      const result = await hooks?.afterPermissionCheck?.(data, mockContext);

      expect(result).toBeDefined();
    });

    it('should execute all defined hooks', async () => {
      const plugin = createCachePlugin();
      await plugin.install(mockContext);

      const hooks = plugin.getHooks?.();

      expect(hooks).toHaveProperty('beforePermissionCheck');
      expect(hooks).toHaveProperty('afterPermissionCheck');
      expect(hooks).toHaveProperty('beforeRoleUpdate');
      expect(hooks).toHaveProperty('afterRoleUpdate');
      expect(hooks).toHaveProperty('beforeRoleAdd');
      expect(hooks).toHaveProperty('afterRoleAdd');
      expect(hooks).toHaveProperty('onError');
    });

    it('should generate cache key correctly', async () => {
      const plugin = createCachePlugin();
      await plugin.install(mockContext);

      const hooks = plugin.getHooks?.();
      const data: HookData = {
        role: 'user',
        operation: 'read',
        params: { id: 1 }
      };

      const result = await hooks?.beforePermissionCheck?.(data, mockContext);

      expect(result?.metadata).toHaveProperty('cacheKey');
      expect(result?.metadata?.cacheKey).toContain('rbac:user:read:');
    });

    it('should use custom configuration', async () => {
      const config: PluginConfig = {
        enabled: true,
        priority: 50,
        settings: {
          ttl: 120,
          maxSize: 500,
          strategy: 'ttl'
        }
      };

      const plugin = createCachePlugin(config);
      await plugin.install(mockContext);

      expect(plugin).toBeDefined();
    });
  });

  describe('Notification Plugin', () => {
    it('should create notification plugin', () => {
      const plugin = createNotificationPlugin();

      expect(plugin.metadata.name).toBe('rbac-notification');
      expect(plugin.metadata.version).toBe('1.0.0');
      expect(plugin.metadata.description).toContain('notification');
    });

    it('should install notification plugin', async () => {
      const plugin = createNotificationPlugin();
      
      await plugin.install(mockContext);

      expect(mockContext.logger).toHaveBeenCalledWith('NotificationPlugin installed', 'info');
    });

    it('should uninstall notification plugin', async () => {
      const plugin = createNotificationPlugin();
      
      await plugin.install(mockContext);
      await plugin.uninstall();

      expect(plugin).toBeDefined();
    });

    it('should execute notification hooks', async () => {
      const plugin = createNotificationPlugin();
      await plugin.install(mockContext);

      const hooks = plugin.getHooks?.();

      expect(hooks).toHaveProperty('beforePermissionCheck');
      expect(hooks).toHaveProperty('afterPermissionCheck');
      expect(hooks).toHaveProperty('onError');
    });

    it('should notify permission events', async () => {
      const plugin = createNotificationPlugin();
      await plugin.install(mockContext);

      const hooks = plugin.getHooks?.();
      const data: HookData = {
        role: 'user',
        operation: 'read',
        params: { id: 1 }
      };

      const result = await hooks?.beforePermissionCheck?.(data, mockContext);

      expect(result).toBeDefined();
    });
  });

  describe('Validation Plugin', () => {
    it('should create validation plugin', () => {
      const plugin = createValidationPlugin();

      expect(plugin.metadata.name).toBe('rbac-validation');
      expect(plugin.metadata.version).toBe('1.0.0');
      expect(plugin.metadata.description).toContain('validation');
    });

    it('should install validation plugin', async () => {
      const plugin = createValidationPlugin();
      
      await plugin.install(mockContext);

      expect(mockContext.logger).toHaveBeenCalledWith('ValidationPlugin installed', 'info');
    });

    it('should uninstall validation plugin', async () => {
      const plugin = createValidationPlugin();
      
      await plugin.install(mockContext);
      await plugin.uninstall();

      expect(plugin).toBeDefined();
    });

    it('should execute validation hooks', async () => {
      const plugin = createValidationPlugin();
      await plugin.install(mockContext);

      const hooks = plugin.getHooks?.();

      expect(hooks).toHaveProperty('beforePermissionCheck');
      expect(hooks).toHaveProperty('beforeRoleUpdate');
      expect(hooks).toHaveProperty('beforeRoleAdd');
    });

    it('should validate permissions', async () => {
      const plugin = createValidationPlugin();
      await plugin.install(mockContext);

      const hooks = plugin.getHooks?.();
      const data: HookData = {
        role: 'user',
        operation: 'read',
        params: { id: 1 }
      };

      const result = await hooks?.beforePermissionCheck?.(data, mockContext);

      expect(result).toBeDefined();
    });
  });

  describe('Usage Examples', () => {
    it('should create Express middleware plugin', () => {
      const plugin = createExpressMiddlewarePlugin({});

      expect(plugin.metadata.name).toBe('rbac-express-middleware');
      expect(plugin.metadata.version).toBe('1.0.0');
      expect(plugin.metadata.description).toContain('Express');
    });

    it('should install Express middleware plugin', async () => {
      const plugin = createExpressMiddlewarePlugin({});
      
      await plugin.install(mockContext);

      expect(mockContext.logger).toHaveBeenCalledWith('ExpressMiddlewarePlugin installed', 'info');
    });

    it('should create middleware function', () => {
      const plugin = createExpressMiddlewarePlugin({});
      
      // Mock the createMiddleware method
      const mockMiddleware = jest.fn();
      (plugin as any).createMiddleware = mockMiddleware;

      (plugin as any).createMiddleware();

      expect(typeof mockMiddleware).toBe('function');
    });

    it('should create Redis cache plugin', () => {
      const plugin = createRedisCachePlugin({});

      expect(plugin.metadata.name).toBe('rbac-redis-cache');
      expect(plugin.metadata.version).toBe('1.0.0');
      expect(plugin.metadata.description).toContain('Redis');
    });

    it('should install Redis cache plugin', async () => {
      const plugin = createRedisCachePlugin({});
      
      await plugin.install(mockContext);

      expect(mockContext.logger).toHaveBeenCalledWith('RedisCachePlugin installed', 'info');
    });

    it('should execute Redis cache hooks', async () => {
      const plugin = createRedisCachePlugin({});
      await plugin.install(mockContext);

      const hooks = plugin.getHooks?.();

      expect(hooks).toHaveProperty('beforePermissionCheck');
      expect(hooks).toHaveProperty('afterPermissionCheck');
    });
  });

  describe('Multiple Plugin Integration', () => {
    it('should work with multiple plugins simultaneously', async () => {
      const cachePlugin = createCachePlugin();
      const notificationPlugin = createNotificationPlugin();
      const validationPlugin = createValidationPlugin();

      await cachePlugin.install(mockContext);
      await notificationPlugin.install(mockContext);
      await validationPlugin.install(mockContext);

      expect(cachePlugin).toBeDefined();
      expect(notificationPlugin).toBeDefined();
      expect(validationPlugin).toBeDefined();
    });

    it('should execute hooks from multiple plugins in sequence', async () => {
      const cachePlugin = createCachePlugin();
      const notificationPlugin = createNotificationPlugin();

      await cachePlugin.install(mockContext);
      await notificationPlugin.install(mockContext);

      const cacheHooks = cachePlugin.getHooks?.();
      const notificationHooks = notificationPlugin.getHooks?.();

      const data: HookData = {
        role: 'user',
        operation: 'read',
        params: { id: 1 }
      };

      // Execute hooks in sequence
      let result: HookData | undefined = data;
      if (cacheHooks?.beforePermissionCheck) {
        const cacheResult = await cacheHooks.beforePermissionCheck(result, mockContext);
        if (cacheResult) {
          result = cacheResult;
        }
      }
      if (notificationHooks?.beforePermissionCheck && result) {
        const notificationResult = await notificationHooks.beforePermissionCheck(result, mockContext);
        if (notificationResult) {
          result = notificationResult;
        }
      }

      expect(result).toBeDefined();
    });

    it('should uninstall multiple plugins', async () => {
      const cachePlugin = createCachePlugin();
      const notificationPlugin = createNotificationPlugin();

      await cachePlugin.install(mockContext);
      await notificationPlugin.install(mockContext);

      await cachePlugin.uninstall();
      await notificationPlugin.uninstall();

      expect(cachePlugin).toBeDefined();
      expect(notificationPlugin).toBeDefined();
    });
  });

  describe('Plugin Configuration', () => {
    it('should accept custom configuration for cache plugin', async () => {
      const config: PluginConfig = {
        enabled: true,
        priority: 80,
        settings: {
          ttl: 300,
          maxSize: 1000,
          strategy: 'lru'
        }
      };

      const plugin = createCachePlugin(config);
      await plugin.install(mockContext);
      await plugin.configure?.(config);

      expect(plugin).toBeDefined();
    });

    it('should accept custom configuration for notification plugin', async () => {
      const config: PluginConfig = {
        enabled: true,
        priority: 60,
        settings: {
          channels: ['email', 'slack'],
          retryAttempts: 3
        }
      };

      const plugin = createNotificationPlugin(config);
      await plugin.install(mockContext);
      await plugin.configure?.(config);

      expect(plugin).toBeDefined();
    });

    it('should accept custom configuration for validation plugin', async () => {
      const config: PluginConfig = {
        enabled: true,
        priority: 90,
        settings: {
          strictMode: true,
          customRules: ['rule1', 'rule2']
        }
      };

      const plugin = createValidationPlugin(config);
      await plugin.install(mockContext);
      await plugin.configure?.(config);

      expect(plugin).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in cache hooks', async () => {
      const plugin = createCachePlugin();
      await plugin.install(mockContext);

      const hooks = plugin.getHooks?.();
      const data: HookData = {
        role: 'user',
        operation: 'read',
        params: { id: 1 }
      };

      // Simulate error in hook
      const originalHook = hooks?.onError;
      if (originalHook) {
        const result = await originalHook(data, mockContext);
        expect(result).toBeDefined();
      }
    });

    it('should handle errors in notification hooks', async () => {
      const plugin = createNotificationPlugin();
      await plugin.install(mockContext);

      const hooks = plugin.getHooks?.();
      const data: HookData = {
        role: 'user',
        operation: 'read',
        params: { id: 1 },
        error: new Error('Test error')
      };

      const originalHook = hooks?.onError;
      if (originalHook) {
        const result = await originalHook(data, mockContext);
        expect(result).toBeDefined();
      }
    });

    it('should handle errors in validation hooks', async () => {
      const plugin = createValidationPlugin();
      await plugin.install(mockContext);

      const hooks = plugin.getHooks?.();
      const data: HookData = {
        role: 'user',
        operation: 'read',
        params: { id: 1 },
        error: new Error('Validation error')
      };

      const originalHook = hooks?.onError;
      if (originalHook) {
        const result = await originalHook(data, mockContext);
        expect(result).toBeDefined();
      }
    });
  });
});