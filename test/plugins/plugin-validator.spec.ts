import { PluginValidator, ValidationResult, SecurityResult } from '../../src/plugins/plugin-validator';
import { Plugin, PluginMetadata } from '../../src/plugins/functional-types';

// Mock plugin for tests
const createMockPlugin = (overrides: Partial<Plugin> = {}): Plugin => ({
  metadata: {
    name: 'test-plugin',
    version: '1.0.0',
    description: 'Test plugin',
    author: 'Test Author',
    license: 'MIT'
  },
  install: jest.fn().mockResolvedValue(undefined),
  uninstall: jest.fn().mockResolvedValue(undefined),
  ...overrides
});

describe('PluginValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Plugin Validation', () => {
    it('should validate valid plugin', () => {
      const plugin = createMockPlugin();
      const result = PluginValidator.validateCommunityPlugin(plugin);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for plugin without metadata', () => {
      const plugin = { install: jest.fn(), uninstall: jest.fn() } as any;
      const result = PluginValidator.validateCommunityPlugin(plugin);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Plugin must have metadata');
    });

    it('should fail for plugin without name', () => {
      const plugin = createMockPlugin({
        metadata: { 
          version: '1.0.0',
          description: 'Test',
          author: 'Test Author',
          license: 'MIT'
        } as any
      });
      const result = PluginValidator.validateCommunityPlugin(plugin);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Plugin must have a name');
    });

    it('should fail for plugin without version', () => {
      const plugin = createMockPlugin({
        metadata: { 
          name: 'test',
          description: 'Test',
          author: 'Test Author',
          license: 'MIT'
        } as any
      });
      const result = PluginValidator.validateCommunityPlugin(plugin);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Plugin must have a version');
    });

    it('should fail for plugin without description', () => {
      const plugin = createMockPlugin({
        metadata: { 
          name: 'test',
          version: '1.0.0',
          author: 'Test Author',
          license: 'MIT'
        } as any
      });
      const result = PluginValidator.validateCommunityPlugin(plugin);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Plugin must have a description');
    });

    it('should fail for plugin without author', () => {
      const plugin = createMockPlugin({
        metadata: { 
          name: 'test',
          version: '1.0.0',
          description: 'Test',
          license: 'MIT'
        } as any
      });
      const result = PluginValidator.validateCommunityPlugin(plugin);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Plugin must have an author');
    });

    it('should fail for plugin without license', () => {
      const plugin = createMockPlugin({
        metadata: { 
          name: 'test',
          version: '1.0.0',
          description: 'Test',
          author: 'Test Author'
        } as any
      });
      const result = PluginValidator.validateCommunityPlugin(plugin);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Plugin must have a license');
    });

    it('should fail for plugin without install method', () => {
      const plugin = createMockPlugin({
        install: undefined
      });
      const result = PluginValidator.validateCommunityPlugin(plugin);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Plugin must implement install function');
    });

    it('should fail for plugin without uninstall method', () => {
      const plugin = createMockPlugin({
        uninstall: undefined
      });
      const result = PluginValidator.validateCommunityPlugin(plugin);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Plugin must implement uninstall function');
    });

    it('should fail for plugin with non-function install', () => {
      const plugin = createMockPlugin({
        install: 'not a function' as any
      });
      const result = PluginValidator.validateCommunityPlugin(plugin);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Plugin must implement install function');
    });

    it('should fail for plugin with non-function uninstall', () => {
      const plugin = createMockPlugin({
        uninstall: 'not a function' as any
      });
      const result = PluginValidator.validateCommunityPlugin(plugin);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Plugin must implement uninstall function');
    });
  });

  describe('Metadata Validation', () => {
    it('should validate complete metadata', () => {
      const plugin = createMockPlugin({
        metadata: {
          name: 'test-plugin',
          version: '1.0.0',
          description: 'Test plugin',
          author: 'Test Author',
          license: 'MIT',
          keywords: ['rbac', 'plugin']
        }
      });
      const result = PluginValidator.validateCommunityPlugin(plugin);

      expect(result.valid).toBe(true);
    });

    it('should validate semantic version format', () => {
      const plugin = createMockPlugin({
        metadata: {
          name: 'test-plugin',
          version: '1.2.3',
          description: 'Test',
          author: 'Test Author',
          license: 'MIT'
        }
      });
      const result = PluginValidator.validateCommunityPlugin(plugin);

      expect(result.valid).toBe(true);
    });

    it('should fail for invalid version format', () => {
      const plugin = createMockPlugin({
        metadata: {
          name: 'test-plugin',
          version: 'invalid-version',
          description: 'Test',
          author: 'Test Author',
          license: 'MIT'
        }
      });
      const result = PluginValidator.validateCommunityPlugin(plugin);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Version must follow semver format (ex: 1.0.0)');
    });

    it('should validate plugin name', () => {
      const plugin = createMockPlugin({
        metadata: {
          name: 'test-plugin-123',
          version: '1.0.0',
          description: 'Test',
          author: 'Test Author',
          license: 'MIT'
        }
      });
      const result = PluginValidator.validateCommunityPlugin(plugin);

      expect(result.valid).toBe(true);
    });

    it('should fail for invalid plugin name', () => {
      const plugin = createMockPlugin({
        metadata: {
          name: 'test plugin!',
          version: '1.0.0',
          description: 'Test',
          author: 'Test Author',
          license: 'MIT'
        }
      });
      const result = PluginValidator.validateCommunityPlugin(plugin);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Plugin name must contain only letters, numbers, hyphens and underscores');
    });
  });

  describe('Hook Validation', () => {
    it('should validate valid hooks', () => {
      const hooks = {
        beforePermissionCheck: jest.fn(),
        afterPermissionCheck: jest.fn()
      };
      const result = PluginValidator.validatePluginHooks(hooks);

      expect(result.valid).toBe(true);
    });

    it('should fail for invalid hooks', () => {
      const hooks = {
        invalidHook: jest.fn(),
        beforePermissionCheck: 'not a function'
      };
      const result = PluginValidator.validatePluginHooks(hooks);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid hook type: invalidHook');
      expect(result.errors).toContain('Hook beforePermissionCheck must be a function');
    });

    it('should validate optional hooks', () => {
      const hooks = {};
      const result = PluginValidator.validatePluginHooks(hooks);

      expect(result.valid).toBe(true);
    });

    it('should validate all supported hook types', () => {
      const hooks = {
        beforePermissionCheck: jest.fn(),
        afterPermissionCheck: jest.fn(),
        beforeRoleUpdate: jest.fn(),
        afterRoleUpdate: jest.fn(),
        beforeRoleAdd: jest.fn(),
        afterRoleAdd: jest.fn(),
        onError: jest.fn()
      };
      const result = PluginValidator.validatePluginHooks(hooks);

      expect(result.valid).toBe(true);
    });
  });

  describe('Security Validation', () => {
    it('should validate safe plugin', () => {
      const plugin = createMockPlugin();
      const result = PluginValidator.validatePluginSecurity(plugin);

      expect(result.safe).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect suspicious code - eval', () => {
      const plugin = createMockPlugin({
        install: () => {
          eval('console.log("suspicious")');
        }
      });
      const result = PluginValidator.validatePluginSecurity(plugin);

      expect(result.safe).toBe(false);
      expect(result.warnings).toContain('Plugin contains potentially unsafe code (eval/Function)');
    });

    it('should detect suspicious code - Function', () => {
      const plugin = createMockPlugin({
        install: () => {
          new Function('console.log("suspicious")')();
        }
      });
      const result = PluginValidator.validatePluginSecurity(plugin);

      expect(result.safe).toBe(false);
      expect(result.warnings).toContain('Plugin contains potentially unsafe code (eval/Function)');
    });

    it('should detect unverified dependencies', () => {
      const plugin = createMockPlugin({
        install: () => {
          require('fs');
        }
      });
      const result = PluginValidator.validatePluginSecurity(plugin);

      expect(result.safe).toBe(false);
      expect(result.warnings).toContain('Plugin may have unverified dependencies');
    });

    it('should detect environment variable access', () => {
      const plugin = createMockPlugin({
        install: () => {
          const password = process.env.PASSWORD;
        }
      });
      const result = PluginValidator.validatePluginSecurity(plugin);

      expect(result.safe).toBe(false);
      expect(result.warnings).toContain('Plugin accesses environment variables without validation');
    });

    it('should detect console.log usage', () => {
      const plugin = createMockPlugin({
        install: () => {
          console.log('debug info');
        }
      });
      const result = PluginValidator.validatePluginSecurity(plugin);

      expect(result.safe).toBe(false);
      expect(result.warnings).toContain('Plugin uses console.log/warn which may leak information in production');
    });

    it('should detect timer usage', () => {
      const plugin = createMockPlugin({
        install: () => {
          setTimeout(() => {}, 1000);
        }
      });
      const result = PluginValidator.validatePluginSecurity(plugin);

      expect(result.safe).toBe(false);
      expect(result.warnings).toContain('Plugin uses timers that may cause memory leaks');
    });
  });

  describe('Version Compatibility Validation', () => {
    it('should validate RBAC version compatibility', () => {
      const plugin = createMockPlugin({
        metadata: {
          name: 'test-plugin',
          version: '1.0.0',
          description: 'Test',
          author: 'Test Author',
          license: 'MIT',
          peerDependencies: { '@rbac/rbac': '^2.0.0' }
        } as any
      });
      const result = PluginValidator.validateVersionCompatibility(plugin, '2.1.0');

      expect(result.valid).toBe(true);
    });

    it('should fail for incompatible RBAC version', () => {
      const plugin = createMockPlugin({
        metadata: {
          name: 'test-plugin',
          version: '1.0.0',
          description: 'Test',
          author: 'Test Author',
          license: 'MIT',
          peerDependencies: { '@rbac/rbac': '^3.0.0' }
        } as any
      });
      const result = PluginValidator.validateVersionCompatibility(plugin, '2.1.0');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Plugin requires @rbac/rbac ^3.0.0 but found 2.1.0');
    });

    it('should validate compatibility without peerDependencies', () => {
      const plugin = createMockPlugin();
      const result = PluginValidator.validateVersionCompatibility(plugin, '2.1.0');

      expect(result.valid).toBe(true);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate valid configuration', () => {
      const config = {
        enabled: true,
        priority: 50,
        settings: { custom: 'value' }
      };
      const result = PluginValidator.validatePluginConfig(config);

      expect(result.valid).toBe(true);
    });

    it('should fail for invalid configuration - not an object', () => {
      const result = PluginValidator.validatePluginConfig('invalid');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Configuration must be an object');
    });

    it('should fail for invalid configuration - no enabled', () => {
      const config = {
        priority: 50,
        settings: {}
      };
      const result = PluginValidator.validatePluginConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Configuration must have enabled field (boolean)');
    });

    it('should fail for invalid configuration - invalid priority', () => {
      const config = {
        enabled: true,
        priority: 150,
        settings: {}
      };
      const result = PluginValidator.validatePluginConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Configuration must have priority field (number between 0 and 100)');
    });

    it('should fail for invalid configuration - no settings', () => {
      const config = {
        enabled: true,
        priority: 50
      };
      const result = PluginValidator.validatePluginConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Configuration must have settings field (object)');
    });
  });

  describe('Hook Validation', () => {
    it('should validate valid hooks', () => {
      const hooks = {
        beforePermissionCheck: jest.fn(),
        afterPermissionCheck: jest.fn()
      };
      const result = PluginValidator.validatePluginHooks(hooks);

      expect(result.valid).toBe(true);
    });

    it('should fail for invalid hooks - not an object', () => {
      const result = PluginValidator.validatePluginHooks('invalid');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Hooks must be an object');
    });

    it('should fail for invalid hook - unsupported type', () => {
      const hooks = {
        invalidHook: jest.fn()
      };
      const result = PluginValidator.validatePluginHooks(hooks);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid hook type: invalidHook');
    });

    it('should fail for invalid hook - not a function', () => {
      const hooks = {
        beforePermissionCheck: 'not a function'
      };
      const result = PluginValidator.validatePluginHooks(hooks);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Hook beforePermissionCheck must be a function');
    });
  });
});