// Exemplo simples de uso do sistema de plugins funcional

import RBAC from '../rbac';
import { createRBACWithPlugins, createCachePlugin, createNotificationPlugin } from './index';

async function exemploSimples() {
  console.log('🚀 Exemplo de Sistema de Plugins Funcional para RBAC\n');

  // 1. Criar RBAC básico
  const rbac = RBAC()({
    user: {
      can: ['products:read', 'profile:update']
    },
    admin: {
      can: ['products:*', 'users:*'],
      inherits: ['user']
    },
    moderator: {
      can: ['products:read', 'products:update', 'comments:*'],
      inherits: ['user']
    }
  });

  // 2. Adicionar sistema de plugins
  const rbacWithPlugins = createRBACWithPlugins(rbac);

  // 3. Instalar plugin de cache
  console.log('📦 Instalando plugin de cache...');
  await rbacWithPlugins.plugins.install(
    createCachePlugin({
      enabled: true,
      priority: 50,
      settings: {
        ttl: 60, // 1 minuto para demonstração
        maxSize: 100,
        strategy: 'lru'
      }
    })
  );

  // 4. Instalar plugin de notificações
  console.log('📦 Instalando plugin de notificações...');
  await rbacWithPlugins.plugins.install(
    createNotificationPlugin({
      enabled: true,
      priority: 40,
      settings: {
        enableRealTime: true,
        channels: [
          {
            type: 'console',
            config: {},
            events: ['permission.denied', 'suspicious.activity']
          }
        ]
      }
    })
  );

  // 5. Testar verificações de permissão
  console.log('\n🔍 Testando verificações de permissão...\n');

  const testes = [
    { role: 'user', operation: 'products:read', esperado: true },
    { role: 'user', operation: 'products:write', esperado: false },
    { role: 'user', operation: 'users:delete', esperado: false },
    { role: 'admin', operation: 'products:delete', esperado: true },
    { role: 'admin', operation: 'users:create', esperado: true },
    { role: 'moderator', operation: 'products:read', esperado: true },
    { role: 'moderator', operation: 'products:delete', esperado: false },
    { role: 'moderator', operation: 'comments:delete', esperado: true }
  ];

  for (const teste of testes) {
    const resultado = await rbacWithPlugins.can(teste.role, teste.operation);
    const status = resultado === teste.esperado ? '✅' : '❌';
    console.log(`${status} ${teste.role} -> ${teste.operation}: ${resultado} (esperado: ${teste.esperado})`);
  }

  // 6. Testar cache (segunda verificação deve ser mais rápida)
  console.log('\n⚡ Testando cache...');
  const inicio = Date.now();
  await rbacWithPlugins.can('user', 'products:read');
  const tempo1 = Date.now() - inicio;

  const inicio2 = Date.now();
  await rbacWithPlugins.can('user', 'products:read');
  const tempo2 = Date.now() - inicio2;

  console.log(`Primeira verificação: ${tempo1}ms`);
  console.log(`Segunda verificação (cache): ${tempo2}ms`);

  // 7. Listar plugins instalados
  console.log('\n📋 Plugins instalados:');
  const plugins = rbacWithPlugins.plugins.getPlugins();
  plugins.forEach((plugin: any) => {
    console.log(`  - ${plugin.name} v${plugin.metadata.version} (${plugin.config.enabled ? 'habilitado' : 'desabilitado'})`);
  });

  // 8. Criar e instalar plugin customizado
  console.log('\n🛠 Criando plugin customizado...');
  const pluginCustomizado = {
    metadata: {
      name: 'custom-logger',
      version: '1.0.0',
      description: 'Plugin customizado para logging detalhado',
      author: 'Desenvolvedor',
      keywords: ['logging', 'custom']
    },

    install: async (context: any) => {
      context.logger('🎉 Plugin customizado instalado!', 'info');
    },

    uninstall: () => {
      console.log('👋 Plugin customizado desinstalado!');
    },

    getHooks: () => ({
      beforePermissionCheck: async (data: any, context: any) => {
        context.logger(`🔍 Verificando: ${data.role} -> ${data.operation}`, 'info');
        return data;
      },

      afterPermissionCheck: async (data: any, context: any) => {
        const emoji = data.result ? '✅' : '❌';
        context.logger(`${emoji} Resultado: ${data.result ? 'PERMITIDO' : 'NEGADO'}`, 'info');
        return data;
      },

      beforeRoleUpdate: async (data: any, context: any) => data,
      afterRoleUpdate: async (data: any, context: any) => data,
      beforeRoleAdd: async (data: any, context: any) => data,
      afterRoleAdd: async (data: any, context: any) => data,
      onError: async (data: any, context: any) => data
    })
  };

  await rbacWithPlugins.plugins.install(pluginCustomizado);

  // 9. Testar com plugin customizado
  console.log('\n🧪 Testando com plugin customizado...');
  await rbacWithPlugins.can('admin', 'products:create');

  // 10. Desabilitar plugin
  console.log('\n⏸ Desabilitando plugin customizado...');
  await rbacWithPlugins.plugins.disable('custom-logger');

  // 11. Testar sem plugin customizado
  console.log('🔇 Testando sem plugin customizado...');
  await rbacWithPlugins.can('user', 'profile:update');

  // 12. Reabilitar plugin
  console.log('\n▶ Reabilitando plugin customizado...');
  await rbacWithPlugins.plugins.enable('custom-logger');

  // 13. Desinstalar plugin
  console.log('\n🗑 Desinstalando plugin customizado...');
  await rbacWithPlugins.plugins.uninstall('custom-logger');

  console.log('\n🎯 Exemplo concluído com sucesso!');
  console.log('\n📚 Para mais exemplos, consulte a documentação em src/plugins/README.md');
}

// Executar exemplo se for chamado diretamente
if (require.main === module) {
  exemploSimples().catch(console.error);
}

export { exemploSimples };
