import RBAC from '../../rbac';
import { createRBACWithPlugins } from '../functional-plugin-system';
import { createCachePlugin } from './cache-plugin';
import { createNotificationPlugin } from './notification-plugin';
import { createValidationPlugin } from './validation-plugin';

// Exemplo de uso do sistema de plugins funcional

async function exemploUso() {
  // 1. Criar instância RBAC básica
  const rbac = RBAC()({
    user: {
      can: ['products:read']
    },
    admin: {
      can: ['products:*'],
      inherits: ['user']
    }
  });

  // 2. Adicionar sistema de plugins
  const rbacWithPlugins = createRBACWithPlugins(rbac);

  // 3. Instalar plugins
  await rbacWithPlugins.plugins.install(
    createCachePlugin({
      enabled: true,
      priority: 50,
      settings: {
        ttl: 300, // 5 minutos
        maxSize: 1000,
        strategy: 'lru'
      }
    })
  );

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

  await rbacWithPlugins.plugins.install(
    createValidationPlugin({
      enabled: true,
      priority: 60,
      settings: {
        strictMode: false,
        validateRoles: true,
        validateOperations: true,
        validateParams: true
      }
    })
  );

  // 4. Usar RBAC com plugins
  console.log('Testando verificação de permissão com plugins...');
  
  const result1 = await rbacWithPlugins.can('user', 'products:read');
  console.log('User pode ler produtos:', result1); // true

  const result2 = await rbacWithPlugins.can('user', 'products:write');
  console.log('User pode escrever produtos:', result2); // false

  const result3 = await rbacWithPlugins.can('admin', 'products:delete');
  console.log('Admin pode deletar produtos:', result3); // true

  // 5. Listar plugins instalados
  const plugins = rbacWithPlugins.plugins.getPlugins();
  console.log('Plugins instalados:', plugins.map((p: any) => p.name));

  // 6. Usar hooks utilitários
  const businessHoursFilter = rbacWithPlugins.hooks.createBusinessHoursFilter();
  const userFilter = rbacWithPlugins.hooks.createUserFilter(['user1', 'user2']);
  const logger = rbacWithPlugins.hooks.createLogger('info');

  // 7. Exemplo de plugin customizado
  const customPlugin = {
    metadata: {
      name: 'custom-logger',
      version: '1.0.0',
      description: 'Plugin customizado para logging detalhado',
      author: 'Desenvolvedor',
      keywords: ['logging', 'custom']
    },

    install: async (context: any) => {
      context.logger('Plugin customizado instalado!', 'info');
    },

    uninstall: () => {
      console.log('Plugin customizado desinstalado!');
    },

    getHooks: () => ({
      beforePermissionCheck: async (data: any, context: any) => {
        context.logger(`Verificando permissão: ${data.role} -> ${data.operation}`, 'info');
        return data;
      },

      afterPermissionCheck: async (data: any, context: any) => {
        context.logger(`Resultado: ${data.result ? 'PERMITIDO' : 'NEGADO'}`, 'info');
        return data;
      }
    })
  };

  await rbacWithPlugins.plugins.install(customPlugin);

  // 8. Testar com plugin customizado
  console.log('\nTestando com plugin customizado...');
  await rbacWithPlugins.can('user', 'products:read');

  // 9. Desabilitar plugin
  await rbacWithPlugins.plugins.disable('custom-logger');
  console.log('Plugin customizado desabilitado');

  // 10. Reabilitar plugin
  await rbacWithPlugins.plugins.enable('custom-logger');
  console.log('Plugin customizado reabilitado');

  // 11. Desinstalar plugin
  await rbacWithPlugins.plugins.uninstall('custom-logger');
  console.log('Plugin customizado desinstalado');
}

// Exemplo de plugin de middleware
export const createExpressMiddlewarePlugin = (app: any) => ({
  metadata: {
    name: 'express-middleware',
    version: '1.0.0',
    description: 'Plugin para integração com Express.js',
    author: 'RBAC Team',
    keywords: ['express', 'middleware', 'http']
  },

  install: async (context: any) => {
    context.logger('Express middleware plugin instalado', 'info');
  },

  uninstall: () => {
    console.log('Express middleware plugin desinstalado');
  },

  getHooks: () => ({
    beforePermissionCheck: async (data: any, context: any) => {
      // Adicionar informações da requisição HTTP
      return {
        ...data,
        metadata: {
          ...data.metadata,
          httpMethod: 'GET', // Exemplo
          userAgent: 'Mozilla/5.0...', // Exemplo
          ipAddress: '192.168.1.1' // Exemplo
        }
      };
    }
  })
});

// Exemplo de plugin de cache Redis
export const createRedisCachePlugin = (redisClient: any) => ({
  metadata: {
    name: 'redis-cache',
    version: '1.0.0',
    description: 'Plugin de cache usando Redis',
    author: 'RBAC Team',
    keywords: ['redis', 'cache', 'performance']
  },

  install: async (context: any) => {
    context.logger('Redis cache plugin instalado', 'info');
  },

  uninstall: () => {
    console.log('Redis cache plugin desinstalado');
  },

  getHooks: () => ({
    beforePermissionCheck: async (data: any, context: any) => {
      const cacheKey = `rbac:${data.role}:${data.operation}`;
      const cached = await redisClient.get(cacheKey);
      
      if (cached !== null) {
        context.logger(`Cache hit: ${cacheKey}`, 'info');
        return {
          ...data,
          result: JSON.parse(cached),
          metadata: {
            ...data.metadata,
            fromCache: true
          }
        };
      }

      return data;
    },

    afterPermissionCheck: async (data: any, context: any) => {
      if (data.result !== undefined) {
        const cacheKey = `rbac:${data.role}:${data.operation}`;
        await redisClient.setex(cacheKey, 300, JSON.stringify(data.result)); // 5 minutos
        context.logger(`Resultado armazenado no Redis: ${cacheKey}`, 'info');
      }

      return data;
    }
  })
});

// Executar exemplo
if (require.main === module) {
  exemploUso().catch(console.error);
}
