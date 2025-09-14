import { PluginLoader } from './plugin-loader';
import { PluginValidator } from './plugin-validator';
import { listAvailablePlugins, getPluginStatus } from './auto-plugin-loader';

export class PluginCLI {
  private loader: PluginLoader;

  constructor() {
    this.loader = new PluginLoader();
  }

  // Listar plugins instalados
  async listInstalledPlugins(): Promise<void> {
    console.log('🔍 Descobrindo plugins instalados...\n');
    
    const plugins = await this.loader.listDiscoveredPlugins();
    
    if (plugins.length === 0) {
      console.log('❌ Nenhum plugin da comunidade encontrado.');
      console.log('💡 Para instalar um plugin, use: npm install @rbac/plugin-nome');
      return;
    }

    console.log(`✅ Encontrados ${plugins.length} plugin(s):\n`);
    
    for (const plugin of plugins) {
      console.log(`📦 ${plugin.name}@${plugin.version}`);
      if (plugin.rbacPlugin) {
        console.log(`   Factory: ${plugin.rbacPlugin.factory}`);
        console.log(`   Plugin Name: ${plugin.rbacPlugin.name}`);
      }
      console.log('');
    }
  }

  // Validar plugin específico
  async validatePlugin(packageName: string): Promise<void> {
    console.log(`🔍 Validando plugin ${packageName}...\n`);
    
    try {
      const plugin = await this.loader.loadPlugin({
        name: packageName,
        version: 'latest',
        main: 'index.js',
        rbacPlugin: {
          name: packageName,
          version: '1.0.0',
          factory: 'createPlugin'
        }
      });

      // Validar estrutura
      const validation = PluginValidator.validateCommunityPlugin(plugin);
      if (!validation.valid) {
        console.log('❌ Plugin inválido:');
        validation.errors.forEach(error => console.log(`   - ${error}`));
        return;
      }

      // Validar segurança
      const security = PluginValidator.validatePluginSecurity(plugin);
      if (!security.safe) {
        console.log('⚠️  Avisos de segurança:');
        security.warnings.forEach(warning => console.log(`   - ${warning}`));
      }

      console.log('✅ Plugin válido!');
      console.log(`   Nome: ${plugin.metadata.name}`);
      console.log(`   Versão: ${plugin.metadata.version}`);
      console.log(`   Autor: ${plugin.metadata.author}`);
      console.log(`   Licença: ${plugin.metadata.license}`);

    } catch (error) {
      console.log(`❌ Erro ao validar plugin: ${error}`);
    }
  }

  // Verificar status de um plugin
  async checkPluginStatus(packageName: string): Promise<void> {
    console.log(`🔍 Verificando status do plugin ${packageName}...\n`);
    
    const status = await getPluginStatus(packageName);
    
    console.log(`📦 ${packageName}:`);
    console.log(`   Instalado: ${status.installed ? '✅ Sim' : '❌ Não'}`);
    console.log(`   Descoberto: ${status.discovered ? '✅ Sim' : '❌ Não'}`);
    
    if (status.package) {
      console.log(`   Versão: ${status.package.version}`);
      console.log(`   Factory: ${status.package.rbacPlugin?.factory || 'createPlugin'}`);
    }
  }

  // Instalar plugin (apenas mostra instruções)
  async installPlugin(packageName: string): Promise<void> {
    console.log(`📦 Para instalar o plugin ${packageName}:\n`);
    console.log(`   npm install ${packageName}`);
    console.log(`\n💡 O plugin será carregado automaticamente na próxima inicialização.`);
  }

  // Desinstalar plugin (apenas mostra instruções)
  async uninstallPlugin(packageName: string): Promise<void> {
    console.log(`🗑️  Para desinstalar o plugin ${packageName}:\n`);
    console.log(`   npm uninstall ${packageName}`);
    console.log(`\n💡 O plugin será removido automaticamente.`);
  }

  // Gerar template de plugin
  async generatePluginTemplate(pluginName: string): Promise<void> {
    const template = `import { Plugin, PluginConfig, PluginContext, HookData } from '@rbac/rbac/plugins';

export interface ${pluginName}Config extends PluginConfig {
  settings: {
    // Adicione suas configurações específicas aqui
    customSetting: string;
  };
}

export const createPlugin = (config: ${pluginName}Config): Plugin => ({
  metadata: {
    name: '${pluginName.toLowerCase()}',
    version: '1.0.0',
    description: 'Descrição do plugin ${pluginName}',
    author: 'Seu Nome <seu@email.com>',
    license: 'MIT',
    keywords: ['rbac', 'plugin', '${pluginName.toLowerCase()}']
  },

  install: async (context: PluginContext) => {
    context.logger('Plugin ${pluginName} instalado!', 'info');
  },

  uninstall: () => {
    console.log('Plugin ${pluginName} desinstalado!');
  },

  getHooks: () => ({
    beforePermissionCheck: async (data: HookData, context: PluginContext) => {
      // Sua lógica aqui
      return data;
    }
  })
});

export default createPlugin;`;

    console.log(`📝 Template gerado para o plugin ${pluginName}:\n`);
    console.log('```typescript');
    console.log(template);
    console.log('```');
    
    console.log('\n📦 package.json:');
    console.log('```json');
    console.log(`{
  "name": "@rbac/plugin-${pluginName.toLowerCase()}",
  "version": "1.0.0",
  "description": "Plugin ${pluginName} para RBAC",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "rbacPlugin": {
    "name": "${pluginName.toLowerCase()}",
    "version": "1.0.0",
    "factory": "createPlugin"
  },
  "keywords": ["rbac", "plugin", "${pluginName.toLowerCase()}"],
  "author": "Seu Nome",
  "license": "MIT",
  "peerDependencies": {
    "@rbac/rbac": "^2.0.0"
  }
}`);
    console.log('```');
  }

  // Mostrar ajuda
  showHelp(): void {
    console.log('🔧 RBAC Plugin CLI\n');
    console.log('Comandos disponíveis:');
    console.log('  list                    - Listar plugins instalados');
    console.log('  validate <package>      - Validar plugin específico');
    console.log('  status <package>        - Verificar status do plugin');
    console.log('  install <package>       - Mostrar instruções de instalação');
    console.log('  uninstall <package>     - Mostrar instruções de desinstalação');
    console.log('  generate <name>         - Gerar template de plugin');
    console.log('  help                    - Mostrar esta ajuda\n');
    console.log('Exemplos:');
    console.log('  rbac-plugin list');
    console.log('  rbac-plugin validate @rbac/plugin-cache');
    console.log('  rbac-plugin generate meu-plugin');
  }
}

// Função principal do CLI
export const runCLI = async (args: string[]): Promise<void> => {
  const cli = new PluginCLI();
  const command = args[0];

  switch (command) {
    case 'list':
      await cli.listInstalledPlugins();
      break;
    
    case 'validate':
      if (!args[1]) {
        console.log('❌ Especifique o nome do plugin para validar');
        return;
      }
      await cli.validatePlugin(args[1]);
      break;
    
    case 'status':
      if (!args[1]) {
        console.log('❌ Especifique o nome do plugin para verificar status');
        return;
      }
      await cli.checkPluginStatus(args[1]);
      break;
    
    case 'install':
      if (!args[1]) {
        console.log('❌ Especifique o nome do plugin para instalar');
        return;
      }
      await cli.installPlugin(args[1]);
      break;
    
    case 'uninstall':
      if (!args[1]) {
        console.log('❌ Especifique o nome do plugin para desinstalar');
        return;
      }
      await cli.uninstallPlugin(args[1]);
      break;
    
    case 'generate':
      if (!args[1]) {
        console.log('❌ Especifique o nome do plugin para gerar template');
        return;
      }
      await cli.generatePluginTemplate(args[1]);
      break;
    
    case 'help':
    default:
      cli.showHelp();
      break;
  }
};
