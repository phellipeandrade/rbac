import { Plugin, PluginConfig, PluginContext, HookData } from './functional-types';

// Template para plugins da comunidade
export interface CommunityPluginConfig extends PluginConfig {
  settings: {
    // Adicione suas configurações específicas aqui
    [key: string]: any;
  };
}

// Função factory obrigatória para plugins da comunidade
export const createPlugin = (config: CommunityPluginConfig): Plugin => ({
  metadata: {
    name: 'meu-plugin-comunidade',
    version: '1.0.0',
    description: 'Descrição do meu plugin para RBAC',
    author: 'Seu Nome <seu@email.com>',
    license: 'MIT',
    keywords: ['rbac', 'plugin', 'comunidade', 'authorization']
  },

  install: async (context: PluginContext) => {
    context.logger('Plugin da comunidade instalado com sucesso!', 'info');
    
    // Configurar listeners de eventos se necessário
    context.events.on('plugin.installed', (data) => {
      context.logger(`Plugin instalado: ${data.plugin}`, 'info');
    });
  },

  uninstall: () => {
    console.log('Plugin da comunidade desinstalado!');
  },

  configure: async (config: PluginConfig) => {
    // Configurar plugin com as configurações fornecidas
    console.log('Configurando plugin:', config);
  },

  getHooks: () => ({
    beforePermissionCheck: async (data: HookData, context: PluginContext) => {
      // Sua lógica antes da verificação de permissão
      context.logger(`Verificando permissão: ${data.role} -> ${data.operation}`, 'info');
      
      // Exemplo: adicionar metadata customizada
      return {
        ...data,
        metadata: {
          ...data.metadata,
          customField: 'valor customizado',
          timestamp: new Date().toISOString()
        }
      };
    },

    afterPermissionCheck: async (data: HookData, context: PluginContext) => {
      // Sua lógica após a verificação de permissão
      if (data.result === false) {
        context.logger(`Acesso negado: ${data.role} -> ${data.operation}`, 'warn');
      }
      
      return data;
    },

    onError: async (data: HookData, context: PluginContext) => {
      // Sua lógica para tratamento de erros
      context.logger(`Erro no plugin: ${data.error?.message}`, 'error');
      return data;
    }
  })
});

// Exportar como padrão para compatibilidade
export default createPlugin;

// Exemplo de uso do template:
/*
// package.json do plugin
{
  "name": "@rbac/plugin-meu-plugin",
  "version": "1.0.0",
  "description": "Meu plugin para RBAC",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "rbacPlugin": {
    "name": "meu-plugin",
    "version": "1.0.0",
    "factory": "createPlugin",
    "config": {
      "enabled": true,
      "priority": 50,
      "settings": {
        "customSetting": "valor padrão"
      }
    }
  },
  "keywords": ["rbac", "plugin", "authorization"],
  "author": "Seu Nome",
  "license": "MIT",
  "peerDependencies": {
    "@rbac/rbac": "^2.0.0"
  },
  "files": [
    "dist/**/*",
    "README.md"
  ]
}

// Uso no projeto principal
import { createRBACWithAutoPlugins } from '@rbac/rbac/plugins';

const rbac = RBAC()({
  user: { can: ['products:read'] },
  admin: { can: ['products:*'], inherits: ['user'] }
});

const rbacWithPlugins = await createRBACWithAutoPlugins(rbac, {
  pluginConfigs: {
    'meu-plugin': {
      enabled: true,
      priority: 60,
      settings: {
        customSetting: 'valor personalizado'
      }
    }
  }
});
*/
