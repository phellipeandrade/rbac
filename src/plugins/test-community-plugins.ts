// Teste do sistema de plugins da comunidade
import RBAC from '../rbac';
import { 
  createRBACWithAutoPlugins, 
  PluginLoader, 
  PluginValidator,
  createCommunityPlugin 
} from './index';

async function testCommunityPluginSystem() {
  console.log('🧪 Testing Community Plugin System\n');

  // 1. Create basic RBAC
  console.log('1. Creating basic RBAC...');
  const rbac = RBAC()({
    user: { can: ['products:read'] },
    admin: { can: ['products:*'], inherits: ['user'] },
    manager: { can: ['products:write', 'users:read'], inherits: ['user'] }
  });

  // 2. Testar PluginLoader
  console.log('\n2. Testando PluginLoader...');
  const loader = new PluginLoader();
  const discoveredPlugins = await loader.listDiscoveredPlugins();
  console.log(`Plugins descobertos: ${discoveredPlugins.length}`);

  // 3. Criar plugin de exemplo
  console.log('\n3. Criando plugin de exemplo...');
  const examplePlugin = createCommunityPlugin({
    enabled: true,
    priority: 50,
    settings: {
      customSetting: 'valor de teste',
      enableLogging: true,
      logLevel: 'info'
    }
  });

  // 4. Validate plugin
  console.log('\n4. Validating plugin...');
  const validation = PluginValidator.validateCommunityPlugin(examplePlugin);
  console.log(`Plugin valid: ${validation.valid}`);
  if (!validation.valid) {
    console.log('Errors:', validation.errors);
  }

  const security = PluginValidator.validatePluginSecurity(examplePlugin);
  console.log(`Plugin safe: ${security.safe}`);
  if (!security.safe) {
    console.log('Warnings:', security.warnings);
  }

  // 5. Test RBAC with auto-plugins
  console.log('\n5. Testing RBAC with auto-plugins...');
  const rbacWithPlugins = await createRBACWithAutoPlugins(rbac, {
    autoLoadCommunityPlugins: false, // Disable to test manually
    validatePlugins: true,
    strictMode: false
  });

  // Install plugin manually
  await rbacWithPlugins.pluginSystem.install(examplePlugin, {
    enabled: true,
    priority: 50,
    settings: {
      customSetting: 'custom value',
      enableLogging: true,
      logLevel: 'info'
    }
  });

  // 6. Testar funcionalidade
  console.log('\n6. Testando funcionalidade...');
  
  const canRead = await rbacWithPlugins.can('user', 'products:read');
  const canWrite = await rbacWithPlugins.can('user', 'products:write');
  const canDelete = await rbacWithPlugins.can('admin', 'products:delete');
  
  console.log(`User can read products: ${canRead}`);
  console.log(`User can write products: ${canWrite}`);
  console.log(`Admin can delete products: ${canDelete}`);

  // 7. List active plugins
  console.log('\n7. Active plugins:');
  const plugins = rbacWithPlugins.pluginSystem.getPlugins();
  plugins.forEach((plugin: any) => {
    console.log(`- ${plugin.name}@${plugin.metadata.version} (${plugin.config.enabled ? 'Enabled' : 'Disabled'})`);
  });

  // 8. Test hooks
  console.log('\n8. Testing hooks...');
  
  // Simulate check with custom metadata
  const testData = {
    role: 'user',
    operation: 'products:read',
    metadata: { userId: '123', ipAddress: '192.168.1.1' }
  };

  const hookResult = await rbacWithPlugins.pluginSystem.executeHooks('beforePermissionCheck', testData);
  console.log('Hook result:', hookResult);

  console.log('\n✅ Test completed successfully!');
}

// Run test
if (require.main === module) {
  testCommunityPluginSystem().catch(error => {
    console.error('❌ Test error:', error);
    process.exit(1);
  });
}

export { testCommunityPluginSystem };
