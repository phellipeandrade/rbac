import { PluginLoader, PluginPackage } from '../../src/plugins/plugin-loader';
import { Plugin, PluginConfig } from '../../src/plugins/functional-types';

// Mock require to simulate module loading
const mockRequire = jest.fn();
jest.mock('module', () => ({
  require: mockRequire
}));

// Mock fs to simulate package.json reading
const mockFs = {
  readFileSync: jest.fn(),
  existsSync: jest.fn()
};
jest.mock('fs', () => mockFs);

describe('PluginLoader', () => {
  let pluginLoader: PluginLoader;
  let mockPackageJson: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockPackageJson = {
      dependencies: {
        '@rbac/plugin-cache': '^1.0.0',
        '@rbac/plugin-audit': '^2.0.0',
        'rbac-plugin-validation': '^1.5.0',
        'normal-package': '^1.0.0'
      },
      devDependencies: {
        '@rbac/plugin-test': '^1.0.0'
      }
    };

    mockFs.readFileSync.mockReturnValue(JSON.stringify(mockPackageJson));
    mockFs.existsSync.mockReturnValue(true);
    
    pluginLoader = new PluginLoader('./package.json');
  });

  describe('Plugin Discovery', () => {
    it('should discover RBAC plugins from dependencies', async () => {
      // Mock plugin modules
      mockRequire
        .mockReturnValueOnce({
          rbacPlugin: {
            name: 'cache',
            version: '1.0.0',
            factory: 'createCachePlugin'
          }
        })
        .mockReturnValueOnce({
          rbacPlugin: {
            name: 'audit',
            version: '2.0.0',
            factory: 'createAuditPlugin'
          }
        })
        .mockReturnValueOnce({
          rbacPlugin: {
            name: 'validation',
            version: '1.5.0',
            factory: 'createValidationPlugin'
          }
        })
        .mockReturnValueOnce({
          rbacPlugin: {
            name: 'test',
            version: '1.0.0',
            factory: 'createTestPlugin'
          }
        });

      const plugins = await pluginLoader.discoverPlugins();

      expect(plugins).toHaveLength(4);
      expect(plugins.map(p => p.name)).toContain('@rbac/plugin-cache');
      expect(plugins.map(p => p.name)).toContain('@rbac/plugin-audit');
      expect(plugins.map(p => p.name)).toContain('rbac-plugin-validation');
      expect(plugins.map(p => p.name)).toContain('@rbac/plugin-test');
    });

    it('should ignore packages that are not RBAC plugins', async () => {
      mockRequire.mockReturnValueOnce({
        rbacPlugin: {
          name: 'cache',
          version: '1.0.0',
          factory: 'createCachePlugin'
        }
      });

      const plugins = await pluginLoader.discoverPlugins();

      expect(plugins).toHaveLength(1);
      expect(plugins[0].name).toBe('@rbac/plugin-cache');
    });

    it('should ignore packages without rbacPlugin', async () => {
      mockRequire.mockReturnValueOnce({
        main: 'index.js',
        // No rbacPlugin
      });

      const plugins = await pluginLoader.discoverPlugins();

      expect(plugins).toHaveLength(0);
    });

    it('should handle errors when loading modules', async () => {
      mockRequire
        .mockImplementationOnce(() => {
          throw new Error('Module not found');
        })
        .mockReturnValueOnce({
          rbacPlugin: {
            name: 'audit',
            version: '2.0.0',
            factory: 'createAuditPlugin'
          }
        });

      const plugins = await pluginLoader.discoverPlugins();

      // Should continue even with error in one module
      expect(plugins).toHaveLength(1);
      expect(plugins[0].name).toBe('@rbac/plugin-audit');
    });

    it('should use correct version from package.json', async () => {
      mockRequire.mockReturnValueOnce({
        rbacPlugin: {
          name: 'cache',
          version: '1.0.0',
          factory: 'createCachePlugin'
        }
      });

      const plugins = await pluginLoader.discoverPlugins();

      expect(plugins[0].version).toBe('^1.0.0');
    });
  });

  describe('Plugin Loading', () => {
    it('should load specific plugin successfully', async () => {
      const mockPlugin = {
        metadata: {
          name: 'test-plugin',
          version: '1.0.0',
          description: 'Test plugin'
        },
        install: jest.fn(),
        uninstall: jest.fn()
      };

      const mockFactory = jest.fn().mockReturnValue(mockPlugin);
      mockRequire.mockReturnValueOnce({
        createTestPlugin: mockFactory
      });

      const pluginPackage: PluginPackage = {
        name: '@rbac/plugin-test',
        version: '1.0.0',
        main: 'index.js',
        rbacPlugin: {
          name: 'test',
          version: '1.0.0',
          factory: 'createTestPlugin',
          config: { enabled: true, priority: 50, settings: {} }
        }
      };

      const plugin = await pluginLoader.loadPlugin(pluginPackage);

      expect(mockFactory).toHaveBeenCalledWith(pluginPackage.rbacPlugin?.config);
      expect(plugin).toBe(mockPlugin);
    });

    it('should use default factory if not specified', async () => {
      const mockPlugin = {
        metadata: { name: 'test', version: '1.0.0' },
        install: jest.fn(),
        uninstall: jest.fn()
      };

      const mockFactory = jest.fn().mockReturnValue(mockPlugin);
      mockRequire.mockReturnValueOnce({
        createPlugin: mockFactory
      });

      const pluginPackage: PluginPackage = {
        name: '@rbac/plugin-test',
        version: '1.0.0',
        main: 'index.js',
        rbacPlugin: {
          name: 'test',
          version: '1.0.0'
          // No factory specified
        }
      };

      await pluginLoader.loadPlugin(pluginPackage);

      expect(mockFactory).toHaveBeenCalledWith({ enabled: true, priority: 50, settings: {} });
    });

    it('should fail if factory is not found', async () => {
      mockRequire.mockReturnValueOnce({
        // No createTestPlugin function
      });

      const pluginPackage: PluginPackage = {
        name: '@rbac/plugin-test',
        version: '1.0.0',
        main: 'index.js',
        rbacPlugin: {
          name: 'test',
          version: '1.0.0',
          factory: 'createTestPlugin'
        }
      };

      await expect(pluginLoader.loadPlugin(pluginPackage))
        .rejects.toThrow("Factory function 'createTestPlugin' not found in @rbac/plugin-test");
    });

    it('should fail if factory is not a function', async () => {
      mockRequire.mockReturnValueOnce({
        createTestPlugin: 'not a function'
      });

      const pluginPackage: PluginPackage = {
        name: '@rbac/plugin-test',
        version: '1.0.0',
        main: 'index.js',
        rbacPlugin: {
          name: 'test',
          version: '1.0.0',
          factory: 'createTestPlugin'
        }
      };

      await expect(pluginLoader.loadPlugin(pluginPackage))
        .rejects.toThrow("Factory function 'createTestPlugin' not found in @rbac/plugin-test");
    });

    it('should fail if module cannot be loaded', async () => {
      mockRequire.mockImplementationOnce(() => {
        throw new Error('Module not found');
      });

      const pluginPackage: PluginPackage = {
        name: '@rbac/plugin-test',
        version: '1.0.0',
        main: 'index.js',
        rbacPlugin: {
          name: 'test',
          version: '1.0.0',
          factory: 'createTestPlugin'
        }
      };

      await expect(pluginLoader.loadPlugin(pluginPackage))
        .rejects.toThrow('Error loading plugin @rbac/plugin-test: Error: Module not found');
    });
  });

  describe('Load All Plugins', () => {
    it('should load all discovered plugins', async () => {
      const mockPlugin1 = {
        metadata: { name: 'plugin1', version: '1.0.0' },
        install: jest.fn(),
        uninstall: jest.fn()
      };

      const mockPlugin2 = {
        metadata: { name: 'plugin2', version: '2.0.0' },
        install: jest.fn(),
        uninstall: jest.fn()
      };

      mockRequire
        .mockReturnValueOnce({
          rbacPlugin: {
            name: 'plugin1',
            version: '1.0.0',
            factory: 'createPlugin1'
          }
        })
        .mockReturnValueOnce({
          rbacPlugin: {
            name: 'plugin2',
            version: '2.0.0',
            factory: 'createPlugin2'
          }
        })
        .mockReturnValueOnce({
          createPlugin1: jest.fn().mockReturnValue(mockPlugin1)
        })
        .mockReturnValueOnce({
          createPlugin2: jest.fn().mockReturnValue(mockPlugin2)
        });

      const plugins = await pluginLoader.loadAllPlugins();

      expect(plugins).toHaveLength(2);
      expect(plugins).toContain(mockPlugin1);
      expect(plugins).toContain(mockPlugin2);
    });

    it('should continue loading even if one plugin fails', async () => {
      const mockPlugin = {
        metadata: { name: 'plugin2', version: '2.0.0' },
        install: jest.fn(),
        uninstall: jest.fn()
      };

      mockRequire
        .mockImplementationOnce(() => {
          throw new Error('Module not found');
        })
        .mockReturnValueOnce({
          rbacPlugin: {
            name: 'plugin2',
            version: '2.0.0',
            factory: 'createPlugin2'
          }
        })
        .mockReturnValueOnce({
          createPlugin2: jest.fn().mockReturnValue(mockPlugin)
        });

      const plugins = await pluginLoader.loadAllPlugins();

      expect(plugins).toHaveLength(1);
      expect(plugins[0]).toBe(mockPlugin);
    });
  });

  describe('Loaded Plugin Management', () => {
    it('should get loaded plugin', async () => {
      const mockPlugin = {
        metadata: { name: 'test', version: '1.0.0' },
        install: jest.fn(),
        uninstall: jest.fn()
      };

      mockRequire.mockReturnValueOnce({
        createTestPlugin: jest.fn().mockReturnValue(mockPlugin)
      });

      const pluginPackage: PluginPackage = {
        name: '@rbac/plugin-test',
        version: '1.0.0',
        main: 'index.js',
        rbacPlugin: {
          name: 'test',
          version: '1.0.0',
          factory: 'createTestPlugin'
        }
      };

      await pluginLoader.loadPlugin(pluginPackage);
      const loadedPlugin = pluginLoader.getLoadedPlugin('@rbac/plugin-test');

      expect(loadedPlugin).toBe(mockPlugin);
    });

    it('should return undefined for non-loaded plugin', () => {
      const loadedPlugin = pluginLoader.getLoadedPlugin('inexistent-plugin');
      expect(loadedPlugin).toBeUndefined();
    });

    it('should list discovered plugins', async () => {
      mockRequire
        .mockReturnValueOnce({
          rbacPlugin: {
            name: 'plugin1',
            version: '1.0.0',
            factory: 'createPlugin1'
          }
        })
        .mockReturnValueOnce({
          rbacPlugin: {
            name: 'plugin2',
            version: '2.0.0',
            factory: 'createPlugin2'
          }
        });

      const discoveredPlugins = await pluginLoader.listDiscoveredPlugins();

      expect(discoveredPlugins).toHaveLength(2);
      expect(discoveredPlugins.map(p => p.name)).toContain('@rbac/plugin-cache');
      expect(discoveredPlugins.map(p => p.name)).toContain('@rbac/plugin-audit');
    });
  });

  describe('Installation Check', () => {
    it('should check if plugin is installed in dependencies', () => {
      expect(pluginLoader.isPluginInstalled('@rbac/plugin-cache')).toBe(true);
      expect(pluginLoader.isPluginInstalled('rbac-plugin-validation')).toBe(true);
      expect(pluginLoader.isPluginInstalled('@rbac/plugin-test')).toBe(true);
    });

    it('should check if plugin is installed in devDependencies', () => {
      expect(pluginLoader.isPluginInstalled('@rbac/plugin-test')).toBe(true);
    });

    it('should return false for non-installed plugin', () => {
      expect(pluginLoader.isPluginInstalled('@rbac/plugin-inexistent')).toBe(false);
      expect(pluginLoader.isPluginInstalled('normal-package')).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent package.json', () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory');
      });

      // Should not throw error, should use default package.json
      expect(() => new PluginLoader('./inexistent-package.json')).not.toThrow();
    });

    it('should handle invalid package.json', () => {
      mockFs.readFileSync.mockReturnValue('invalid json');

      // Should not throw error, should use default package.json
      expect(() => new PluginLoader('./invalid-package.json')).not.toThrow();
    });
  });

  describe('Plugin Configuration', () => {
    it('should use default configuration when not specified', async () => {
      const mockPlugin = {
        metadata: { name: 'test', version: '1.0.0' },
        install: jest.fn(),
        uninstall: jest.fn()
      };

      const mockFactory = jest.fn().mockReturnValue(mockPlugin);
      mockRequire.mockReturnValueOnce({
        createTestPlugin: mockFactory
      });

      const pluginPackage: PluginPackage = {
        name: '@rbac/plugin-test',
        version: '1.0.0',
        main: 'index.js',
        rbacPlugin: {
          name: 'test',
          version: '1.0.0',
          factory: 'createTestPlugin'
          // No config
        }
      };

      await pluginLoader.loadPlugin(pluginPackage);

      expect(mockFactory).toHaveBeenCalledWith({
        enabled: true,
        priority: 50,
        settings: {}
      });
    });

    it('should use custom configuration when specified', async () => {
      const mockPlugin = {
        metadata: { name: 'test', version: '1.0.0' },
        install: jest.fn(),
        uninstall: jest.fn()
      };

      const customConfig: PluginConfig = {
        enabled: false,
        priority: 80,
        settings: { custom: 'value' }
      };

      const mockFactory = jest.fn().mockReturnValue(mockPlugin);
      mockRequire.mockReturnValueOnce({
        createTestPlugin: mockFactory
      });

      const pluginPackage: PluginPackage = {
        name: '@rbac/plugin-test',
        version: '1.0.0',
        main: 'index.js',
        rbacPlugin: {
          name: 'test',
          version: '1.0.0',
          factory: 'createTestPlugin',
          config: customConfig
        }
      };

      await pluginLoader.loadPlugin(pluginPackage);

      expect(mockFactory).toHaveBeenCalledWith(customConfig);
    });
  });
});