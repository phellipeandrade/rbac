import { createCachePlugin, createCacheUtils } from '../../src/plugins/functional-examples/cache-plugin';
import { PluginConfig, PluginContext, HookData } from '../../src/plugins/functional-types';

const createMockContext = (): PluginContext => ({
  rbac: {
    can: jest.fn().mockResolvedValue(true),
    updateRoles: jest.fn(),
    addRole: jest.fn()
  },
  logger: jest.fn(),
  events: {
    on: jest.fn(),
    emit: jest.fn()
  }
});

describe('Cache Plugin Behavior', () => {
  let plugin: ReturnType<typeof createCachePlugin> | null;
  let context: PluginContext;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T00:00:00Z'));
    context = createMockContext();
    plugin = null;
  });

  afterEach(async () => {
    if (plugin) {
      await plugin.uninstall();
    }
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const runPermissionFlow = async (hooks: Record<string, any>, data: HookData, result: boolean) => {
    const before = await hooks.beforePermissionCheck?.(data, context);
    expect(before).toBeDefined();
    await hooks.afterPermissionCheck?.({ ...before!, result }, context);
  };

  it('should reuse cached results for repeated permission checks', async () => {
    plugin = createCachePlugin({ enabled: true, priority: 50, settings: {} });
    await plugin.install(context);

    const hooks = plugin.getHooks?.();
    expect(hooks).toBeDefined();

    const data: HookData = {
      role: 'user',
      operation: 'read',
      params: { id: 1 }
    };

    const first = await hooks!.beforePermissionCheck?.(data, context);
    expect(first).toBeDefined();
    expect(first?.metadata?.fromCache).toBeUndefined();

    await hooks!.afterPermissionCheck?.({ ...first!, result: true }, context);

    const second = await hooks!.beforePermissionCheck?.(data, context);
    expect(second).toBeDefined();
    expect(second?.result).toBe(true);
    expect(second?.metadata?.fromCache).toBe(true);

    const hitLogs = (context.logger as jest.Mock).mock.calls.filter(([message]) =>
      typeof message === 'string' && message.includes('Cache hit')
    );
    expect(hitLogs.length).toBeGreaterThan(0);
  });

  it('should expire cached entries after TTL and cleanup interval', async () => {
    const config: PluginConfig = {
      enabled: true,
      priority: 50,
      settings: {
        ttl: 1,
        maxSize: 10,
        strategy: 'lru'
      }
    };

    plugin = createCachePlugin(config);
    await plugin.install(context);

    const hooks = plugin.getHooks?.();
    expect(hooks).toBeDefined();

    const data: HookData = {
      role: 'user',
      operation: 'read',
      params: { id: 1 }
    };

    const initial = await hooks!.beforePermissionCheck?.(data, context);
    await hooks!.afterPermissionCheck?.({ ...initial!, result: true }, context);

    jest.advanceTimersByTime(1100);
    jest.advanceTimersByTime(60000);

    const after = await hooks!.beforePermissionCheck?.(data, context);
    expect(after).toBeDefined();
    expect(after?.metadata?.fromCache).toBeUndefined();

    const hitLogs = (context.logger as jest.Mock).mock.calls.filter(([message]) =>
      typeof message === 'string' && message.includes('Cache hit')
    );
    expect(hitLogs.length).toBe(0);
  });

  it.each(['lru', 'fifo'] as const)(
    'should evict oldest entry when strategy is %s',
    async (strategy) => {
      const config: PluginConfig = {
        enabled: true,
        priority: 50,
        settings: {
          ttl: 60,
          maxSize: 1,
          strategy
        }
      };

      plugin = createCachePlugin(config);
      await plugin.install(context);

      const hooks = plugin.getHooks?.();
      expect(hooks).toBeDefined();

      const data1: HookData = {
        role: 'user',
        operation: 'read',
        params: { id: 1 }
      };

      await runPermissionFlow(hooks!, data1, true);

      jest.advanceTimersByTime(5);

      const data2: HookData = {
        role: 'user',
        operation: 'update',
        params: { id: 2 }
      };

      await runPermissionFlow(hooks!, data2, false);

      const cachedFirst = await hooks!.beforePermissionCheck?.(data1, context);
      expect(cachedFirst).toBeDefined();
      expect(cachedFirst?.metadata?.fromCache).toBeUndefined();

      const hitLogs = (context.logger as jest.Mock).mock.calls.filter(([message]) =>
        typeof message === 'string' && message.includes('Cache hit')
      );
      expect(hitLogs.length).toBe(0);
    }
  );

  it('should evict entry closest to expiration when strategy is ttl', async () => {
    const config: PluginConfig = {
      enabled: true,
      priority: 50,
      settings: {
        ttl: 1,
        maxSize: 2,
        strategy: 'ttl'
      }
    };

    plugin = createCachePlugin(config);
    await plugin.install(context);

    const hooks = plugin.getHooks?.();
    expect(hooks).toBeDefined();

    const data1: HookData = {
      role: 'user',
      operation: 'read',
      params: { id: 1 }
    };

    await runPermissionFlow(hooks!, data1, true);

    jest.advanceTimersByTime(1100);

    const data2: HookData = {
      role: 'admin',
      operation: 'write',
      params: { id: 2 }
    };

    await runPermissionFlow(hooks!, data2, false);

    jest.advanceTimersByTime(1100);

    const data3: HookData = {
      role: 'editor',
      operation: 'delete',
      params: { id: 3 }
    };

    await runPermissionFlow(hooks!, data3, true);

    const cachedFirst = await hooks!.beforePermissionCheck?.(data1, context);
    expect(cachedFirst).toBeDefined();
    expect(cachedFirst?.metadata?.fromCache).toBeUndefined();

    const cachedSecond = await hooks!.beforePermissionCheck?.(data2, context);
    expect(cachedSecond).toBeDefined();
    expect(cachedSecond?.metadata?.fromCache).toBeUndefined();

    const cachedThird = await hooks!.beforePermissionCheck?.(data3, context);
    expect(cachedThird).toBeDefined();
    expect(cachedThird?.metadata?.fromCache).toBe(true);

    const hitLogs = (context.logger as jest.Mock).mock.calls.filter(([message]) =>
      typeof message === 'string' && message.includes('Cache hit')
    );
    expect(hitLogs).toHaveLength(1);
    expect(hitLogs[0][0]).toContain('editor');
  });
});

describe('createCacheUtils', () => {
  it('should expose default utility stubs', () => {
    const plugin = createCachePlugin();
    const utils = createCacheUtils(plugin);

    expect(utils.getStats()).toEqual({ size: 0, hits: 0, misses: 0, hitRate: 0 });
    expect(utils.clear()).toBeUndefined();
    expect(utils.get('test-key')).toBeUndefined();
    expect(utils.set('test-key', 'value', 10)).toBeUndefined();
  });
});

