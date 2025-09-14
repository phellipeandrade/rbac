import { Plugin, PluginConfig } from './functional-types';

export interface PluginPackage {
  name: string;
  version: string;
  main: string;
  rbacPlugin?: {
    name: string;
    version: string;
    factory: string; // nome da função exportada
    config?: PluginConfig;
  };
}

export class PluginLoader {
  private loadedPlugins: Map<string, Plugin> = new Map();
  private packageJson: any;

  constructor(packageJsonPath: string = './package.json') {
    try {
      this.packageJson = require(packageJsonPath);
    } catch (error) {
      console.warn('Não foi possível carregar package.json:', error);
      this.packageJson = { dependencies: {}, devDependencies: {} };
    }
  }

  // Descobrir plugins instalados
  async discoverPlugins(): Promise<PluginPackage[]> {
    const plugins: PluginPackage[] = [];
    const dependencies = {
      ...this.packageJson.dependencies,
      ...this.packageJson.devDependencies
    };

    for (const [packageName, version] of Object.entries(dependencies)) {
      if (packageName.startsWith('@rbac/plugin-') || packageName.startsWith('rbac-plugin-')) {
        try {
          const pluginPackage = require(packageName);
          if (pluginPackage.rbacPlugin) {
            plugins.push({
              name: packageName,
              version: version as string,
              main: pluginPackage.main || 'index.js',
              rbacPlugin: pluginPackage.rbacPlugin
            });
          }
        } catch (error) {
          console.warn(`Erro ao carregar plugin ${packageName}:`, error);
        }
      }
    }

    return plugins;
  }

  // Carregar plugin específico
  async loadPlugin(pluginPackage: PluginPackage): Promise<Plugin> {
    try {
      const pluginModule = require(pluginPackage.name);
      const factoryName = pluginPackage.rbacPlugin?.factory || 'createPlugin';
      const factory = pluginModule[factoryName];

      if (!factory || typeof factory !== 'function') {
        throw new Error(`Factory function '${factoryName}' não encontrada em ${pluginPackage.name}`);
      }

      const config = pluginPackage.rbacPlugin?.config || { enabled: true, priority: 50, settings: {} };
      const plugin = factory(config);

      this.loadedPlugins.set(pluginPackage.name, plugin);
      return plugin;

    } catch (error) {
      throw new Error(`Erro ao carregar plugin ${pluginPackage.name}: ${error}`);
    }
  }

  // Carregar todos os plugins descobertos
  async loadAllPlugins(): Promise<Plugin[]> {
    const discoveredPlugins = await this.discoverPlugins();
    const loadedPlugins: Plugin[] = [];

    for (const pluginPackage of discoveredPlugins) {
      try {
        const plugin = await this.loadPlugin(pluginPackage);
        loadedPlugins.push(plugin);
      } catch (error) {
        console.error(`Falha ao carregar plugin ${pluginPackage.name}:`, error);
      }
    }

    return loadedPlugins;
  }

  // Obter plugin carregado
  getLoadedPlugin(name: string): Plugin | undefined {
    return this.loadedPlugins.get(name);
  }

  // Listar plugins descobertos
  async listDiscoveredPlugins(): Promise<PluginPackage[]> {
    return this.discoverPlugins();
  }

  // Verificar se plugin está instalado
  isPluginInstalled(packageName: string): boolean {
    const dependencies = {
      ...this.packageJson.dependencies,
      ...this.packageJson.devDependencies
    };
    return packageName in dependencies;
  }
}
