import { createRBACWithAutoPlugins, loadSpecificPlugins, listAvailablePlugins, getPluginStatus } from '../../src/plugins/auto-plugin-loader';

jest.mock('../../src/plugins/plugin-loader', () => {
  const actual = jest.requireActual('../../src/plugins/plugin-loader');
  class MockPluginLoader {
    constructor() {
      MockPluginLoader.instances.push(this);
    }

    static instances: MockPluginLoader[] = [];
    static mocks = {
      loadAllPlugins: jest.fn(),
      listDiscoveredPlugins: jest.fn(),
      loadPlugin: jest.fn(),
      isPluginInstalled: jest.fn()
    };

    loadAllPlugins = MockPluginLoader.mocks.loadAllPlugins;
    listDiscoveredPlugins = MockPluginLoader.mocks.listDiscoveredPlugins;
    loadPlugin = MockPluginLoader.mocks.loadPlugin;
    isPluginInstalled = MockPluginLoader.mocks.isPluginInstalled;
  }

  return { PluginLoader: MockPluginLoader, __esModule: true, default: actual.default };
});

jest.mock('../../src/plugins/functional-plugin-system', () => {
  return {
    createRBACWithPlugins: jest.fn().mockImplementation((rbac) => ({
      ...rbac,
      plugins: {
        install: jest.fn()
      }
    }))
  };
});

jest.mock('../../src/plugins/plugin-validator', () => ({
  PluginValidator: {
    validateCommunityPlugin: jest.fn().mockReturnValue({ valid: true, errors: [] }),
    validatePluginSecurity: jest.fn().mockReturnValue({ safe: true, warnings: [] })
  }
}));

const MockPluginLoader: any = jest.requireMock('../../src/plugins/plugin-loader').PluginLoader;
const { PluginValidator } = jest.requireMock('../../src/plugins/plugin-validator');
const { createRBACWithPlugins } = jest.requireMock('../../src/plugins/functional-plugin-system');

const createMockPlugin = (name: string) => ({
  metadata: {
    name,
    version: '1.0.0',
    author: 'Test',
    description: 'Test plugin'
  },
  install: jest.fn(),
  uninstall: jest.fn()
});

const createMockRBAC = () => ({ can: jest.fn() });

describe('auto-plugin-loader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    MockPluginLoader.instances.length = 0;
  });

  describe('createRBACWithAutoPlugins', () => {
    it('instala plugins automaticamente por padrão', async () => {
      const plugin = createMockPlugin('plugin-a');
      MockPluginLoader.mocks.loadAllPlugins.mockResolvedValue([plugin]);
      const rbacWithPlugins = createMockRBAC();
      (createRBACWithPlugins as jest.Mock).mockReturnValue({ ...rbacWithPlugins, plugins: { install: jest.fn() } });

      const result = await createRBACWithAutoPlugins(rbacWithPlugins);

      expect(MockPluginLoader.mocks.loadAllPlugins).toHaveBeenCalled();
      expect(result.plugins.install).toHaveBeenCalledWith(plugin, expect.objectContaining({ enabled: true }));
    });

    it('ignora plugins inválidos quando validatePlugins está ativo', async () => {
      const plugin = createMockPlugin('plugin-invalid');
      MockPluginLoader.mocks.loadAllPlugins.mockResolvedValue([plugin]);
      (PluginValidator.validateCommunityPlugin as jest.Mock).mockReturnValueOnce({ valid: false, errors: ['invalid'] });
      const install = jest.fn();
      (createRBACWithPlugins as jest.Mock).mockReturnValue({ plugins: { install } });

      await createRBACWithAutoPlugins(createMockRBAC());

      expect(install).not.toHaveBeenCalled();
    });

    it('lança erro em modo estrito quando a validação falha', async () => {
      const plugin = createMockPlugin('plugin-invalid');
      MockPluginLoader.mocks.loadAllPlugins.mockResolvedValue([plugin]);
      (PluginValidator.validateCommunityPlugin as jest.Mock).mockReturnValueOnce({ valid: false, errors: ['invalid'] });
      (createRBACWithPlugins as jest.Mock).mockReturnValue({ plugins: { install: jest.fn() } });

      await expect(
        createRBACWithAutoPlugins(createMockRBAC(), { strictMode: true })
      ).rejects.toThrow('Plugin inválido');
    });

    it('usa configuração personalizada quando fornecida', async () => {
      const plugin = createMockPlugin('plugin-config');
      MockPluginLoader.mocks.loadAllPlugins.mockResolvedValue([plugin]);
      const install = jest.fn();
      (createRBACWithPlugins as jest.Mock).mockReturnValue({ plugins: { install } });

      await createRBACWithAutoPlugins(createMockRBAC(), {
        pluginConfigs: {
          'plugin-config': { enabled: false, priority: 99, settings: { custom: true } }
        }
      });

      expect(install).toHaveBeenCalledWith(plugin, expect.objectContaining({ enabled: false, priority: 99 }));
    });

    it('não carrega plugins quando autoLoadCommunityPlugins é falso', async () => {
      const install = jest.fn();
      (createRBACWithPlugins as jest.Mock).mockReturnValue({ plugins: { install } });

      await createRBACWithAutoPlugins(createMockRBAC(), { autoLoadCommunityPlugins: false });

      expect(MockPluginLoader.mocks.loadAllPlugins).not.toHaveBeenCalled();
      expect(install).not.toHaveBeenCalled();
    });
  });

  describe('loadSpecificPlugins', () => {
    it('carrega plug-ins específicos quando instalados', async () => {
      const plugin = createMockPlugin('plugin-target');
      MockPluginLoader.mocks.isPluginInstalled.mockReturnValue(true);
      MockPluginLoader.mocks.listDiscoveredPlugins.mockResolvedValue([{ name: 'plugin-target', version: '1.0.0' }]);
      MockPluginLoader.mocks.loadPlugin.mockResolvedValue(plugin);
      const install = jest.fn();
      (createRBACWithPlugins as jest.Mock).mockReturnValue({ plugins: { install } });

      await loadSpecificPlugins(createMockRBAC(), ['plugin-target']);

      expect(install).toHaveBeenCalledWith(plugin, expect.objectContaining({ enabled: true }));
    });

    it('ignora quando plugin não está instalado', async () => {
      MockPluginLoader.mocks.isPluginInstalled.mockReturnValue(false);
      const install = jest.fn();
      (createRBACWithPlugins as jest.Mock).mockReturnValue({ plugins: { install } });

      await loadSpecificPlugins(createMockRBAC(), ['missing-plugin']);

      expect(install).not.toHaveBeenCalled();
    });

    it('pula plugins não encontrados nas descobertas', async () => {
      MockPluginLoader.mocks.isPluginInstalled.mockReturnValue(true);
      MockPluginLoader.mocks.listDiscoveredPlugins.mockResolvedValue([]);
      const install = jest.fn();
      (createRBACWithPlugins as jest.Mock).mockReturnValue({ plugins: { install } });

      await loadSpecificPlugins(createMockRBAC(), ['not-found']);

      expect(install).not.toHaveBeenCalled();
    });

    it('respeita strictMode propagando erros', async () => {
      MockPluginLoader.mocks.isPluginInstalled.mockReturnValue(true);
      MockPluginLoader.mocks.listDiscoveredPlugins.mockResolvedValue([{ name: 'plugin-target', version: '1.0.0' }]);
      MockPluginLoader.mocks.loadPlugin.mockRejectedValue(new Error('load failed'));
      (createRBACWithPlugins as jest.Mock).mockReturnValue({ plugins: { install: jest.fn() } });

      await expect(
        loadSpecificPlugins(createMockRBAC(), ['plugin-target'], { strictMode: true })
      ).rejects.toThrow('load failed');
    });
  });

  describe('listAvailablePlugins', () => {
    it('retorna nomes de plugins descobertos', async () => {
      MockPluginLoader.mocks.listDiscoveredPlugins.mockResolvedValue([
        { name: 'plugin-one', version: '1.0.0' },
        { name: 'plugin-two', version: '2.0.0' }
      ]);

      const result = await listAvailablePlugins();

      expect(result).toEqual(['plugin-one', 'plugin-two']);
    });
  });

  describe('getPluginStatus', () => {
    it('retorna estado de instalação e descoberta', async () => {
      MockPluginLoader.mocks.isPluginInstalled.mockReturnValue(true);
      MockPluginLoader.mocks.listDiscoveredPlugins.mockResolvedValue([{ name: 'plugin-one', version: '1.0.0' }]);

      const status = await getPluginStatus('plugin-one');

      expect(status.installed).toBe(true);
      expect(status.discovered).toBe(true);
      expect(status.package?.name).toBe('plugin-one');
    });
  });
});

