import { Plugin, PluginConfig } from './functional-types';
import fs from 'fs';
import Module from 'module';

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
      if (fs.existsSync(packageJsonPath)) {
        const content = fs.readFileSync(packageJsonPath, 'utf-8');
        this.packageJson = JSON.parse(content);
      } else {
        console.warn("Couldn't load package.json: file not found");
        this.packageJson = { dependencies: {}, devDependencies: {} };
      }
    } catch (error) {
      console.warn("Couldn't load package.json:", error);
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
          const pluginPackage = (Module as any).require(packageName);
          if (pluginPackage.rbacPlugin) {
            plugins.push({
              name: packageName,
              version: version as string,
              main: pluginPackage.main || 'index.js',
              rbacPlugin: pluginPackage.rbacPlugin
            });
          }
        } catch (error) {
          console.warn(`Error loading discovered plugin ${packageName}:`, error);
        }
      }
    }

    return plugins;
  }

  // Carregar plugin específico
  async loadPlugin(pluginPackage: PluginPackage): Promise<Plugin> {
    try {
      const pluginModule = (Module as any).require(pluginPackage.name);
      const factoryName = pluginPackage.rbacPlugin?.factory || 'createPlugin';
      const factory = pluginModule[factoryName];

      if (!factory || typeof factory !== 'function') {
        throw new Error(`Factory function '${factoryName}' not found in ${pluginPackage.name}`);
      }

      const config = pluginPackage.rbacPlugin?.config || { enabled: true, priority: 50, settings: {} };
      const plugin = factory(config);

      this.loadedPlugins.set(pluginPackage.name, plugin);
      return plugin;

    } catch (error) {
      throw new Error(`Error loading plugin ${pluginPackage.name}: ${error instanceof Error ? error.message : String(error)}`);
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
        console.error(`Failed to load plugin ${pluginPackage.name}:`, error);
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
