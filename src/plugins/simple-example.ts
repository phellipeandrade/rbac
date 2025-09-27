// Simple example of using the functional plugin system

import RBAC from '../rbac';
import { createRBACWithPlugins, createCachePlugin, createNotificationPlugin } from './index';

async function simpleExample() {
  console.log('🚀 Functional Plugin System Example for RBAC\n');

  // 1. Create basic RBAC
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

  // 2. Add plugin system
  const rbacWithPlugins = createRBACWithPlugins(rbac);

  // 3. Install cache plugin
  console.log('📦 Installing cache plugin...');
  await rbacWithPlugins.pluginSystem.install(
    createCachePlugin({
      enabled: true,
      priority: 50,
      settings: {
        ttl: 60, // 1 minute for demonstration
        maxSize: 100,
        strategy: 'lru'
      }
    })
  );

  // 4. Install notification plugin
  console.log('📦 Installing notification plugin...');
  await rbacWithPlugins.pluginSystem.install(
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

  // 5. Test permission checks
  console.log('\n🔍 Testing permission checks...\n');

  const tests = [
    { role: 'user', operation: 'products:read', expected: true },
    { role: 'user', operation: 'products:write', expected: false },
    { role: 'user', operation: 'users:delete', expected: false },
    { role: 'admin', operation: 'products:delete', expected: true },
    { role: 'admin', operation: 'users:create', expected: true },
    { role: 'moderator', operation: 'products:read', expected: true },
    { role: 'moderator', operation: 'products:delete', expected: false },
    { role: 'moderator', operation: 'comments:delete', expected: true }
  ];

  for (const test of tests) {
    const result = await rbacWithPlugins.can(test.role, test.operation);
    const status = result === test.expected ? '✅' : '❌';
    console.log(`${status} ${test.role} -> ${test.operation}: ${result} (expected: ${test.expected})`);
  }

  // 6. Test cache (second check should be faster)
  console.log('\n⚡ Testing cache...');
  const start = Date.now();
  await rbacWithPlugins.can('user', 'products:read');
  const time1 = Date.now() - start;

  const start2 = Date.now();
  await rbacWithPlugins.can('user', 'products:read');
  const time2 = Date.now() - start2;

  console.log(`First check: ${time1}ms`);
  console.log(`Second check (cache): ${time2}ms`);

  // 7. List installed plugins
  console.log('\n📋 Installed plugins:');
  const plugins = rbacWithPlugins.pluginSystem.getPlugins();
  plugins.forEach((plugin: any) => {
    console.log(`  - ${plugin.name} v${plugin.metadata.version} (${plugin.config.enabled ? 'enabled' : 'disabled'})`);
  });

  // 8. Create and install custom plugin
  console.log('\n🛠 Creating custom plugin...');
  const customPlugin = {
    metadata: {
      name: 'custom-logger',
      version: '1.0.0',
      description: 'Custom plugin for detailed logging',
      author: 'Developer',
      keywords: ['logging', 'custom']
    },

    install: async (context: any) => {
      context.logger('🎉 Custom plugin installed!', 'info');
    },

    uninstall: () => {
      console.log('👋 Custom plugin uninstalled!');
    },

    getHooks: () => ({
      beforePermissionCheck: async (data: any, context: any) => {
        context.logger(`🔍 Checking: ${data.role} -> ${data.operation}`, 'info');
        return data;
      },

      afterPermissionCheck: async (data: any, context: any) => {
        const emoji = data.result ? '✅' : '❌';
        context.logger(`${emoji} Result: ${data.result ? 'ALLOWED' : 'DENIED'}`, 'info');
        return data;
      },

      beforeRoleUpdate: async (data: any, context: any) => data,
      afterRoleUpdate: async (data: any, context: any) => data,
      beforeRoleAdd: async (data: any, context: any) => data,
      afterRoleAdd: async (data: any, context: any) => data,
      onError: async (data: any, context: any) => data
    })
  };

  await rbacWithPlugins.pluginSystem.install(customPlugin);

  // 9. Test with custom plugin
  console.log('\n🧪 Testing with custom plugin...');
  await rbacWithPlugins.can('admin', 'products:create');

  // 10. Disable plugin
  console.log('\n⏸ Disabling custom plugin...');
  await rbacWithPlugins.pluginSystem.disable('custom-logger');

  // 11. Test without custom plugin
  console.log('🔇 Testing without custom plugin...');
  await rbacWithPlugins.can('user', 'profile:update');

  // 12. Re-enable plugin
  console.log('\n▶ Re-enabling custom plugin...');
  await rbacWithPlugins.pluginSystem.enable('custom-logger');

  // 13. Uninstall plugin
  console.log('\n🗑 Uninstalling custom plugin...');
  await rbacWithPlugins.pluginSystem.uninstall('custom-logger');

  console.log('\n🎯 Example completed successfully!');
  console.log('\n📚 For more examples, check the documentation at src/plugins/README.md');
}

// Run example if called directly
if (require.main === module) {
  simpleExample().catch(console.error);
}

export { simpleExample };
