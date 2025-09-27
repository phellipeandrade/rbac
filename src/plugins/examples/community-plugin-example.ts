// Exemplo de uso do sistema de plugins da comunidade
import RBAC from '../../rbac';
import { 
  createRBACWithAutoPlugins, 
  loadSpecificPlugins,
  listAvailablePlugins,
  getPluginStatus,
  PluginCLI 
} from '../index';

// Example 1: Basic usage with auto-loading
export const basicExample = async () => {
  console.log('🚀 Basic Example - Auto-loading plugins\n');

  // Create basic RBAC
  const rbac = RBAC()({
    user: { can: ['products:read'] },
    admin: { can: ['products:*'], inherits: ['user'] },
    manager: { can: ['products:write', 'users:read'], inherits: ['user'] }
  });

  // RBAC com plugins da comunidade carregados automaticamente
  const rbacWithPlugins = await createRBACWithAutoPlugins(rbac, {
    autoLoadCommunityPlugins: true,
    validatePlugins: true,
    strictMode: false,
    pluginConfigs: {
      'cache-plugin': {
        enabled: true,
        priority: 60,
        settings: { ttl: 300, maxSize: 1000 }
      },
      'notification-plugin': {
        enabled: true,
        priority: 40,
        settings: { 
          enableRealTime: true,
          channels: [{ type: 'console', events: ['permission.denied'] }]
        }
      }
    }
  });

  // Use RBAC normally - plugins work automatically
  console.log('Testing permissions with active plugins:');
  
  const canRead = await rbacWithPlugins.can('user', 'products:read');
  const canWrite = await rbacWithPlugins.can('user', 'products:write');
  const canDelete = await rbacWithPlugins.can('admin', 'products:delete');
  
  console.log(`User pode ler produtos: ${canRead}`); // true
  console.log(`User pode escrever produtos: ${canWrite}`); // false
  console.log(`Admin pode deletar produtos: ${canDelete}`); // true

  // Listar plugins instalados
  const plugins = rbacWithPlugins.pluginSystem.getPlugins();
  console.log('\nPlugins ativos:');
  plugins.forEach((plugin: any) => {
    console.log(`- ${plugin.name}@${plugin.metadata.version} (${plugin.config.enabled ? 'Habilitado' : 'Desabilitado'})`);
  });
};

// Example 2: Specific plugin loading
export const specificLoadingExample = async () => {
  console.log('\n🎯 Example 2 - Specific plugin loading\n');

  const rbac = RBAC()({
    user: { can: ['products:read'] },
    admin: { can: ['products:*'], inherits: ['user'] }
  });

  // Load only specific plugins
  const rbacWithSpecificPlugins = await loadSpecificPlugins(rbac, [
    '@rbac/plugin-cache',
    'rbac-plugin-custom'
  ], {
    validatePlugins: true,
    pluginConfigs: {
      'cache-plugin': {
        enabled: true,
        priority: 50,
        settings: { ttl: 600 }
      }
    }
  });

  console.log('Specific plugins loaded successfully!');
};

// Example 3: CLI management
export const cliExample = async () => {
  console.log('\n🔧 Example 3 - CLI management\n');

  const cli = new PluginCLI();

  // List installed plugins
  await cli.listInstalledPlugins();

  // Check status of a specific plugin
  await cli.checkPluginStatus('@rbac/plugin-cache');

  // Validate plugin
  await cli.validatePlugin('@rbac/plugin-cache');

  // Generate plugin template
  await cli.generatePluginTemplate('meu-plugin-custom');
};

// Example 4: Available plugins verification
export const verificationExample = async () => {
  console.log('\n🔍 Example 4 - Plugin verification\n');

  // List available plugins
  const availablePlugins = await listAvailablePlugins();
  console.log('Available plugins:', availablePlugins);

  // Check status of specific plugins
  const status1 = await getPluginStatus('@rbac/plugin-cache');
  const status2 = await getPluginStatus('rbac-plugin-custom');

  console.log('\nPlugin status:');
  console.log('Cache plugin:', status1);
  console.log('Custom plugin:', status2);
};

// Example 5: Advanced configuration
export const advancedConfigurationExample = async () => {
  console.log('\n⚙️ Example 5 - Advanced configuration\n');

  const rbac = RBAC()({
    user: { can: ['products:read'] },
    admin: { can: ['products:*'], inherits: ['user'] }
  });

  // Configuration with strict validation
  const rbacWithStrictValidation = await createRBACWithAutoPlugins(rbac, {
    autoLoadCommunityPlugins: true,
    validatePlugins: true,
    strictMode: true, // Fail if there are security warnings
    pluginConfigs: {
      'cache-plugin': {
        enabled: true,
        priority: 80,
        settings: {
          ttl: 300,
          maxSize: 500,
          strategy: 'lru'
        }
      }
    }
  });

  console.log('RBAC configured with strict validation');
};

// Run all examples
export const runAllExamples = async () => {
  try {
    await basicExample();
    await specificLoadingExample();
    await cliExample();
    await verificationExample();
    await advancedConfigurationExample();
    
    console.log('\n✅ All examples executed successfully!');
  } catch (error) {
    console.error('\n❌ Error executing examples:', error);
  }
};

// Run if called directly
if (require.main === module) {
  runAllExamples();
}
