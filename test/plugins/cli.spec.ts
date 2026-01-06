import { PluginCLI, runCLI } from '../../src/plugins/cli';

jest.mock('../../src/plugins/plugin-loader', () => {
  class MockPluginLoader {
    constructor() {
      MockPluginLoader.instances.push(this);
    }

    static instances: MockPluginLoader[] = [];
    static mocks = {
      listDiscoveredPlugins: jest.fn(),
      loadPlugin: jest.fn()
    };

    listDiscoveredPlugins = MockPluginLoader.mocks.listDiscoveredPlugins;
    loadPlugin = MockPluginLoader.mocks.loadPlugin;
    isPluginInstalled = jest.fn();
  }

  return { PluginLoader: MockPluginLoader, __esModule: true };
});

jest.mock('../../src/plugins/plugin-validator', () => ({
  PluginValidator: {
    validateCommunityPlugin: jest.fn().mockReturnValue({ valid: true, errors: [] }),
    validatePluginSecurity: jest.fn().mockReturnValue({ safe: true, warnings: [] })
  }
}));

jest.mock('../../src/plugins/auto-plugin-loader', () => ({
  listAvailablePlugins: jest.fn(),
  getPluginStatus: jest.fn()
}));

const MockPluginLoader: any = jest.requireMock('../../src/plugins/plugin-loader').PluginLoader;
const { PluginValidator } = jest.requireMock('../../src/plugins/plugin-validator');
const { listAvailablePlugins, getPluginStatus } = jest.requireMock('../../src/plugins/auto-plugin-loader');

describe('PluginCLI', () => {
  let originalConsole: Console;
  let consoleSpy: { log: jest.SpiedFunction<typeof console.log>; warn: jest.SpiedFunction<typeof console.warn>; error: jest.SpiedFunction<typeof console.error>; };

  beforeAll(() => {
    originalConsole = global.console;
  });

  beforeEach(() => {
    MockPluginLoader.instances.length = 0;
    jest.clearAllMocks();
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(() => undefined),
      warn: jest.spyOn(console, 'warn').mockImplementation(() => undefined),
      error: jest.spyOn(console, 'error').mockImplementation(() => undefined)
    };
  });

  afterEach(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.warn.mockRestore();
    consoleSpy.error.mockRestore();
  });

  afterAll(() => {
    global.console = originalConsole;
  });

  const createCLI = () => new PluginCLI();

  it('lista plugins instalados com sucesso', async () => {
    MockPluginLoader.mocks.listDiscoveredPlugins.mockResolvedValue([
      { name: '@rbac/plugin-a', version: '1.0.0', rbacPlugin: { factory: 'createPlugin', name: 'plugin-a' } }
    ]);

    const cli = createCLI();
    await cli.listInstalledPlugins();

    expect(MockPluginLoader.mocks.listDiscoveredPlugins).toHaveBeenCalled();
    expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('@rbac/plugin-a'));
  });

  it('avisa quando nenhum plugin é encontrado', async () => {
    MockPluginLoader.mocks.listDiscoveredPlugins.mockResolvedValue([]);

    const cli = createCLI();
    await cli.listInstalledPlugins();

    expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('Nenhum plugin'));
  });

  it('valida plugin com sucesso', async () => {
    const plugin = {
      metadata: { name: '@rbac/plugin-test', version: '1.0.0', author: 'Test Author', license: 'MIT' },
      install: jest.fn(),
      uninstall: jest.fn()
    };

    MockPluginLoader.mocks.loadPlugin.mockResolvedValue(plugin);

    const cli = createCLI();
    await cli.validatePlugin('@rbac/plugin-test');

    expect(MockPluginLoader.mocks.loadPlugin).toHaveBeenCalledWith(expect.objectContaining({ name: '@rbac/plugin-test' }));
    expect(PluginValidator.validateCommunityPlugin).toHaveBeenCalledWith(plugin);
    expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('Plugin válido'));
  });

  it('mostra erros ao validar plugin inválido', async () => {
    (PluginValidator.validateCommunityPlugin as jest.Mock).mockReturnValueOnce({ valid: false, errors: ['error'] });
    MockPluginLoader.mocks.loadPlugin.mockResolvedValue({ metadata: { name: 'invalid', version: '1.0.0' } });

    const cli = createCLI();
    await cli.validatePlugin('invalid');

    expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('Plugin inválido'));
  });

  it('exibe status do plugin', async () => {
    (getPluginStatus as jest.Mock).mockResolvedValue({ installed: true, discovered: false });

    const cli = createCLI();
    await cli.checkPluginStatus('@rbac/plugin-test');

    expect(getPluginStatus).toHaveBeenCalledWith('@rbac/plugin-test');
    expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('Instalado'));
  });

  it('informa instruções de instalação e desinstalação', async () => {
    const cli = createCLI();
    await cli.installPlugin('@rbac/plugin-test');
    await cli.uninstallPlugin('@rbac/plugin-test');

    expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('npm install @rbac/plugin-test'));
    expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('npm uninstall @rbac/plugin-test'));
  });

  it('gera template de plugin', async () => {
    const cli = createCLI();
    await cli.generatePluginTemplate('MyPlugin');

    expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('Template gerado'));
    expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('@rbac/plugin-myplugin'));
  });

  describe('runCLI', () => {
    it('executa comando list', async () => {
      MockPluginLoader.mocks.listDiscoveredPlugins.mockResolvedValue([]);
      await runCLI(['list']);
      expect(MockPluginLoader.mocks.listDiscoveredPlugins).toHaveBeenCalled();
    });

    it('exige argumento para validate', async () => {
      await runCLI(['validate']);
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('Especifique o nome do plugin para validar'));
    });

    it('executa validate com argumento', async () => {
      MockPluginLoader.mocks.loadPlugin.mockResolvedValue({ metadata: { name: 'valid', version: '1.0.0', author: 'A', license: 'MIT' } });
      await runCLI(['validate', 'valid']);
      expect(MockPluginLoader.mocks.loadPlugin).toHaveBeenCalled();
    });

    it('mostra ajuda para comando desconhecido', async () => {
      await runCLI(['unknown']);
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('RBAC Plugin CLI'));
    });
  });
});

