import RBAC from '../../rbac';
import { createRBACWithPlugins } from '../functional-plugin-system';
import { createCachePlugin } from './cache-plugin';
import { createNotificationPlugin } from './notification-plugin';
import { createValidationPlugin } from './validation-plugin';

// Example of using the functional plugin system

async function usageExample() {
  // 1. Create basic RBAC instance
  const rbac = RBAC()({
    user: {
      can: ['products:read']
    },
    admin: {
      can: ['products:*'],
      inherits: ['user']
    }
  });

  // 2. Add plugin system
  const rbacWithPlugins = createRBACWithPlugins(rbac);

  // 3. Install plugins
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
  console.log('Testing permission check with plugins...');
  
  const result1 = await rbacWithPlugins.can('user', 'products:read');
  console.log('User can read products:', result1); // true

  const result2 = await rbacWithPlugins.can('user', 'products:write');
  console.log('User can write products:', result2); // false

  const result3 = await rbacWithPlugins.can('admin', 'products:delete');
  console.log('Admin can delete products:', result3); // true

  // 5. List installed plugins
  const plugins = rbacWithPlugins.plugins.getPlugins();
  console.log('Installed plugins:', plugins.map((p: any) => p.name));

  // 6. Use utility hooks
  const businessHoursFilter = rbacWithPlugins.hooks.createBusinessHoursFilter();
  const userFilter = rbacWithPlugins.hooks.createUserFilter(['user1', 'user2']);
  const logger = rbacWithPlugins.hooks.createLogger('info');

  // 7. Custom plugin example
  const customPlugin = {
    metadata: {
      name: 'custom-logger',
      version: '1.0.0',
      description: 'Custom plugin for detailed logging',
      author: 'Developer',
      keywords: ['logging', 'custom']
    },

    install: async (context: any) => {
      context.logger('Custom plugin installed!', 'info');
    },

    uninstall: () => {
      console.log('Custom plugin uninstalled!');
    },

    getHooks: () => ({
      beforePermissionCheck: async (data: any, context: any) => {
        context.logger(`Checking permission: ${data.role} -> ${data.operation}`, 'info');
        return data;
      },

      afterPermissionCheck: async (data: any, context: any) => {
        context.logger(`Result: ${data.result ? 'ALLOWED' : 'DENIED'}`, 'info');
        return data;
      }
    })
  };

  await rbacWithPlugins.plugins.install(customPlugin);

  // 8. Test with custom plugin
  console.log('\nTesting with custom plugin...');
  await rbacWithPlugins.can('user', 'products:read');

  // 9. Disable plugin
  await rbacWithPlugins.plugins.disable('custom-logger');
  console.log('Custom plugin disabled');

  // 10. Re-enable plugin
  await rbacWithPlugins.plugins.enable('custom-logger');
  console.log('Custom plugin re-enabled');

  // 11. Uninstall plugin
  await rbacWithPlugins.plugins.uninstall('custom-logger');
  console.log('Custom plugin uninstalled');
}

// Middleware plugin example
export const createExpressMiddlewarePlugin = (app: any) => ({
  metadata: {
    name: 'express-middleware',
    version: '1.0.0',
    description: 'Plugin for Express.js integration',
    author: 'RBAC Team',
    keywords: ['express', 'middleware', 'http']
  },

  install: async (context: any) => {
    context.logger('Express middleware plugin installed', 'info');
  },

  uninstall: () => {
    console.log('Express middleware plugin uninstalled');
  },

  getHooks: () => ({
    beforePermissionCheck: async (data: any, context: any) => {
      // Add HTTP request information
      return {
        ...data,
        metadata: {
          ...data.metadata,
          httpMethod: 'GET', // Example
          userAgent: 'Mozilla/5.0...', // Example
          ipAddress: '192.168.1.1' // Example
        }
      };
    }
  })
});

// Redis cache plugin example
export const createRedisCachePlugin = (redisClient: any) => ({
  metadata: {
    name: 'redis-cache',
    version: '1.0.0',
    description: 'Cache plugin using Redis',
    author: 'RBAC Team',
    keywords: ['redis', 'cache', 'performance']
  },

  install: async (context: any) => {
    context.logger('Redis cache plugin installed', 'info');
  },

  uninstall: () => {
    console.log('Redis cache plugin uninstalled');
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
        await redisClient.setex(cacheKey, 300, JSON.stringify(data.result)); // 5 minutes
        context.logger(`Result stored in Redis: ${cacheKey}`, 'info');
      }

      return data;
    }
  })
});

// Run example
if (require.main === module) {
  usageExample().catch(console.error);
}
