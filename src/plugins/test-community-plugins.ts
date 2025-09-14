// Teste do sistema de plugins da comunidade
import RBAC from '../rbac';
import { 
  createRBACWithAutoPlugins, 
  PluginLoader, 
  PluginValidator,
  createCommunityPlugin 
} from './index';

async function testCommunityPluginSystem() {
  console.log('🧪 Testando Sistema de Plugins da Comunidade\n');

  // 1. Criar RBAC básico
  console.log('1. Criando RBAC básico...');
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

  // 4. Validar plugin
  console.log('\n4. Validando plugin...');
  const validation = PluginValidator.validateCommunityPlugin(examplePlugin);
  console.log(`Plugin válido: ${validation.valid}`);
  if (!validation.valid) {
    console.log('Erros:', validation.errors);
  }

  const security = PluginValidator.validatePluginSecurity(examplePlugin);
  console.log(`Plugin seguro: ${security.safe}`);
  if (!security.safe) {
    console.log('Avisos:', security.warnings);
  }

  // 5. Testar RBAC com auto-plugins
  console.log('\n5. Testando RBAC com auto-plugins...');
  const rbacWithPlugins = await createRBACWithAutoPlugins(rbac, {
    autoLoadCommunityPlugins: false, // Desabilitar para testar manualmente
    validatePlugins: true,
    strictMode: false
  });

  // Instalar plugin manualmente
  await rbacWithPlugins.plugins.install(examplePlugin, {
    enabled: true,
    priority: 50,
    settings: {
      customSetting: 'valor personalizado',
      enableLogging: true,
      logLevel: 'info'
    }
  });

  // 6. Testar funcionalidade
  console.log('\n6. Testando funcionalidade...');
  
  const canRead = await rbacWithPlugins.can('user', 'products:read');
  const canWrite = await rbacWithPlugins.can('user', 'products:write');
  const canDelete = await rbacWithPlugins.can('admin', 'products:delete');
  
  console.log(`User pode ler produtos: ${canRead}`);
  console.log(`User pode escrever produtos: ${canWrite}`);
  console.log(`Admin pode deletar produtos: ${canDelete}`);

  // 7. Listar plugins ativos
  console.log('\n7. Plugins ativos:');
  const plugins = rbacWithPlugins.plugins.getPlugins();
  plugins.forEach((plugin: any) => {
    console.log(`- ${plugin.name}@${plugin.metadata.version} (${plugin.config.enabled ? 'Habilitado' : 'Desabilitado'})`);
  });

  // 8. Testar hooks
  console.log('\n8. Testando hooks...');
  
  // Simular verificação com metadata customizada
  const testData = {
    role: 'user',
    operation: 'products:read',
    metadata: { userId: '123', ipAddress: '192.168.1.1' }
  };

  const hookResult = await rbacWithPlugins.plugins.executeHooks('beforePermissionCheck', testData);
  console.log('Resultado do hook:', hookResult);

  console.log('\n✅ Teste concluído com sucesso!');
}

// Executar teste
if (require.main === module) {
  testCommunityPluginSystem().catch(error => {
    console.error('❌ Erro no teste:', error);
    process.exit(1);
  });
}

export { testCommunityPluginSystem };
