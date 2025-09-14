// Exemplo de uso do sistema de plugins da comunidade
import RBAC from '../../rbac';
import { 
  createRBACWithAutoPlugins, 
  loadSpecificPlugins,
  listAvailablePlugins,
  getPluginStatus,
  PluginCLI 
} from '../index';

// Exemplo 1: Uso básico com auto-carregamento
export const exemploBasico = async () => {
  console.log('🚀 Exemplo Básico - Auto-carregamento de plugins\n');

  // Criar RBAC básico
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

  // Usar RBAC normalmente - os plugins funcionam automaticamente
  console.log('Testando permissões com plugins ativos:');
  
  const canRead = await rbacWithPlugins.can('user', 'products:read');
  const canWrite = await rbacWithPlugins.can('user', 'products:write');
  const canDelete = await rbacWithPlugins.can('admin', 'products:delete');
  
  console.log(`User pode ler produtos: ${canRead}`); // true
  console.log(`User pode escrever produtos: ${canWrite}`); // false
  console.log(`Admin pode deletar produtos: ${canDelete}`); // true

  // Listar plugins instalados
  const plugins = rbacWithPlugins.plugins.getPlugins();
  console.log('\nPlugins ativos:');
  plugins.forEach(plugin => {
    console.log(`- ${plugin.name}@${plugin.metadata.version} (${plugin.config.enabled ? 'Habilitado' : 'Desabilitado'})`);
  });
};

// Exemplo 2: Carregamento específico de plugins
export const exemploCarregamentoEspecifico = async () => {
  console.log('\n🎯 Exemplo 2 - Carregamento específico de plugins\n');

  const rbac = RBAC()({
    user: { can: ['products:read'] },
    admin: { can: ['products:*'], inherits: ['user'] }
  });

  // Carregar apenas plugins específicos
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

  console.log('Plugins específicos carregados com sucesso!');
};

// Exemplo 3: Gerenciamento via CLI
export const exemploCLI = async () => {
  console.log('\n🔧 Exemplo 3 - Gerenciamento via CLI\n');

  const cli = new PluginCLI();

  // Listar plugins instalados
  await cli.listInstalledPlugins();

  // Verificar status de um plugin específico
  await cli.checkPluginStatus('@rbac/plugin-cache');

  // Validar plugin
  await cli.validatePlugin('@rbac/plugin-cache');

  // Gerar template de plugin
  await cli.generatePluginTemplate('meu-plugin-custom');
};

// Exemplo 4: Verificação de plugins disponíveis
export const exemploVerificacao = async () => {
  console.log('\n🔍 Exemplo 4 - Verificação de plugins\n');

  // Listar plugins disponíveis
  const availablePlugins = await listAvailablePlugins();
  console.log('Plugins disponíveis:', availablePlugins);

  // Verificar status de plugins específicos
  const status1 = await getPluginStatus('@rbac/plugin-cache');
  const status2 = await getPluginStatus('rbac-plugin-custom');

  console.log('\nStatus dos plugins:');
  console.log('Cache plugin:', status1);
  console.log('Custom plugin:', status2);
};

// Exemplo 5: Configuração avançada
export const exemploConfiguracaoAvancada = async () => {
  console.log('\n⚙️ Exemplo 5 - Configuração avançada\n');

  const rbac = RBAC()({
    user: { can: ['products:read'] },
    admin: { can: ['products:*'], inherits: ['user'] }
  });

  // Configuração com validação rigorosa
  const rbacWithStrictValidation = await createRBACWithAutoPlugins(rbac, {
    autoLoadCommunityPlugins: true,
    validatePlugins: true,
    strictMode: true, // Falha se houver avisos de segurança
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

  console.log('RBAC configurado com validação rigorosa');
};

// Executar todos os exemplos
export const executarExemplos = async () => {
  try {
    await exemploBasico();
    await exemploCarregamentoEspecifico();
    await exemploCLI();
    await exemploVerificacao();
    await exemploConfiguracaoAvancada();
    
    console.log('\n✅ Todos os exemplos executados com sucesso!');
  } catch (error) {
    console.error('\n❌ Erro ao executar exemplos:', error);
  }
};

// Executar se chamado diretamente
if (require.main === module) {
  executarExemplos();
}
