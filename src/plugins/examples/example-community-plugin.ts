// Exemplo de plugin da comunidade
// Este arquivo demonstra como criar um plugin que pode ser publicado no NPM

import { Plugin, PluginConfig, PluginContext, HookData } from '../functional-types';

export interface ExamplePluginConfig extends PluginConfig {
  settings: {
    enableLogging: boolean;
    logLevel: 'info' | 'warn' | 'error';
    customMessage: string;
  };
}

export const createPlugin = (config: ExamplePluginConfig): Plugin => ({
  metadata: {
    name: 'example-community-plugin',
    version: '1.0.0',
    description: 'Plugin de exemplo para demonstrar plugins da comunidade',
    author: 'RBAC Team <team@rbac.com>',
    license: 'MIT',
    keywords: ['rbac', 'plugin', 'example', 'community', 'logging']
  },

  install: async (context: PluginContext) => {
    context.logger('Plugin de exemplo instalado!', 'info');
    
    // Configurar listeners de eventos
    context.events.on('plugin.installed', (data) => {
      if (config.settings.enableLogging) {
        context.logger(`Plugin instalado: ${data.plugin}`, config.settings.logLevel);
      }
    });

    context.events.on('plugin.error', (data) => {
      if (config.settings.enableLogging) {
        context.logger(`Erro no plugin: ${data.plugin} - ${data.error}`, 'error');
      }
    });
  },

  uninstall: () => {
    console.log('Plugin de exemplo desinstalado!');
  },

  configure: async (newConfig: PluginConfig) => {
    // Atualizar configurações
    Object.assign(config, newConfig);
    console.log('Plugin de exemplo reconfigurado');
  },

  getHooks: () => ({
    beforePermissionCheck: async (data: HookData, context: PluginContext) => {
      if (config.settings.enableLogging) {
        context.logger(
          `${config.settings.customMessage} - Verificando: ${data.role} -> ${data.operation}`, 
          config.settings.logLevel
        );
      }
      
      // Adicionar metadata customizada
      return {
        ...data,
        metadata: {
          ...data.metadata,
          examplePlugin: true,
          customMessage: config.settings.customMessage,
          timestamp: new Date().toISOString(),
          logLevel: config.settings.logLevel
        }
      };
    },

    afterPermissionCheck: async (data: HookData, context: PluginContext) => {
      if (config.settings.enableLogging) {
        const message = data.result 
          ? `✅ Acesso permitido: ${data.role} -> ${data.operation}`
          : `❌ Acesso negado: ${data.role} -> ${data.operation}`;
        
        context.logger(message, data.result ? 'info' : 'warn');
      }
      
      return data;
    },

    beforeRoleUpdate: async (data: HookData, context: PluginContext) => {
      // Sua lógica antes de atualizar roles
      return data;
    },

    afterRoleUpdate: async (data: HookData, context: PluginContext) => {
      // Sua lógica após atualizar roles
      return data;
    },

    beforeRoleAdd: async (data: HookData, context: PluginContext) => {
      // Sua lógica antes de adicionar role
      return data;
    },

    afterRoleAdd: async (data: HookData, context: PluginContext) => {
      // Sua lógica após adicionar role
      return data;
    },

    onError: async (data: HookData, context: PluginContext) => {
      if (config.settings.enableLogging) {
        context.logger(
          `🚨 Erro no plugin de exemplo: ${data.error?.message}`, 
          'error'
        );
      }
      
      return data;
    }
  })
});

// Exportar como padrão para compatibilidade
export default createPlugin;

// Exemplo de package.json para este plugin:
// {
//   "name": "@rbac/plugin-example",
//   "version": "1.0.0",
//   "description": "Plugin de exemplo para RBAC",
//   "main": "dist/index.js",
//   "types": "dist/index.d.ts",
//   "rbacPlugin": {
//     "name": "example-community-plugin",
//     "version": "1.0.0",
//     "factory": "createPlugin",
//     "config": {
//       "enabled": true,
//       "priority": 50,
//       "settings": {
//         "enableLogging": true,
//         "logLevel": "info",
//         "customMessage": "🔍 Verificando permissão"
//       }
//     }
//   },
//   "keywords": ["rbac", "plugin", "example", "logging"],
//   "author": "RBAC Team",
//   "license": "MIT",
//   "peerDependencies": {
//     "@rbac/rbac": "^2.0.0"
//   },
//   "files": [
//     "dist/**/*",
//     "README.md"
//   ],
//   "scripts": {
//     "build": "tsc",
//     "prepublishOnly": "npm run build"
//   }
// }
