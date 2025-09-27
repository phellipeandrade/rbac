import { PluginLoader } from './plugin-loader';
import { createRBACWithPlugins } from './functional-plugin-system';
import { PluginValidator } from './plugin-validator';

export interface AutoPluginOptions {
  autoLoadCommunityPlugins?: boolean;
  pluginConfigs?: Record<string, any>;
  validatePlugins?: boolean;
  strictMode?: boolean;
}

export const createRBACWithAutoPlugins = async (
  rbacInstance: any, 
  options: AutoPluginOptions = {}
) => {
  const {
    autoLoadCommunityPlugins = true,
    pluginConfigs = {},
    validatePlugins = true,
    strictMode = false
  } = options;

  const rbacWithPlugins = createRBACWithPlugins(rbacInstance);
  
  if (autoLoadCommunityPlugins) {
    const loader = new PluginLoader();
    const communityPlugins = await loader.loadAllPlugins();
    
    // Instalar plugins da comunidade
    for (const plugin of communityPlugins) {
      try {
        // Validar plugin se habilitado
        if (validatePlugins) {
          const validation = PluginValidator.validateCommunityPlugin(plugin);
          if (!validation.valid) {
            console.error(`Plugin ${plugin.metadata.name} falhou na validação:`, validation.errors);
            if (strictMode) {
              throw new Error(`Plugin inválido: ${validation.errors.join(', ')}`);
            }
            continue;
          }

          const security = PluginValidator.validatePluginSecurity(plugin);
          if (!security.safe) {
            console.warn(`Plugin ${plugin.metadata.name} tem avisos de segurança:`, security.warnings);
            if (strictMode) {
              throw new Error(`Plugin inseguro: ${security.warnings.join(', ')}`);
            }
          }
        }

        const config = pluginConfigs[plugin.metadata.name] || { enabled: true, priority: 50, settings: {} };
        await rbacWithPlugins.pluginSystem.install(plugin, config);
        
        console.log(`Plugin da comunidade ${plugin.metadata.name}@${plugin.metadata.version} instalado com sucesso`);
        
      } catch (error) {
        console.error(`Falha ao instalar plugin ${plugin.metadata.name}:`, error);
        if (strictMode) {
          throw error;
        }
      }
    }
  }
  
  return rbacWithPlugins;
};

// Função para carregar plugins específicos
export const loadSpecificPlugins = async (
  rbacInstance: any,
  pluginNames: string[],
  options: AutoPluginOptions = {}
) => {
  const rbacWithPlugins = createRBACWithPlugins(rbacInstance);
  const loader = new PluginLoader();
  
  for (const pluginName of pluginNames) {
    try {
      if (!loader.isPluginInstalled(pluginName)) {
        console.warn(`Plugin ${pluginName} não está instalado`);
        continue;
      }

      const discoveredPlugins = await loader.listDiscoveredPlugins();
      const pluginPackage = discoveredPlugins.find(p => p.name === pluginName);
      
      if (!pluginPackage) {
        console.warn(`Plugin ${pluginName} não encontrado nos plugins descobertos`);
        continue;
      }

      const plugin = await loader.loadPlugin(pluginPackage);
      
      // Validar plugin se habilitado
      if (options.validatePlugins !== false) {
        const validation = PluginValidator.validateCommunityPlugin(plugin);
        if (!validation.valid) {
          console.error(`Plugin ${plugin.metadata.name} falhou na validação:`, validation.errors);
          continue;
        }
      }

      const config = options.pluginConfigs?.[plugin.metadata.name] || { enabled: true, priority: 50, settings: {} };
      await rbacWithPlugins.pluginSystem.install(plugin, config);
      
      console.log(`Plugin ${plugin.metadata.name}@${plugin.metadata.version} carregado com sucesso`);
      
    } catch (error) {
      console.error(`Falha ao carregar plugin ${pluginName}:`, error);
      if (options.strictMode) {
        throw error;
      }
    }
  }
  
  return rbacWithPlugins;
};

// Função para listar plugins disponíveis
export const listAvailablePlugins = async (): Promise<string[]> => {
  const loader = new PluginLoader();
  const discoveredPlugins = await loader.listDiscoveredPlugins();
  return discoveredPlugins.map(p => p.name);
};

// Função para verificar status de um plugin
export const getPluginStatus = async (pluginName: string) => {
  const loader = new PluginLoader();
  const isInstalled = loader.isPluginInstalled(pluginName);
  const discoveredPlugins = await loader.listDiscoveredPlugins();
  const pluginPackage = discoveredPlugins.find(p => p.name === pluginName);
  
  return {
    installed: isInstalled,
    discovered: !!pluginPackage,
    package: pluginPackage
  };
};
