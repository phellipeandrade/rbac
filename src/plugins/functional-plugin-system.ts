import { EventEmitter } from 'events';
import { 
  Plugin, 
  PluginConfig, 
  PluginContext, 
  HookType, 
  HookData, 
  HookHandler, 
  PluginSystem 
} from './functional-types';

// Estado global do sistema de plugins
interface PluginState {
  plugins: Map<string, Plugin>;
  configs: Map<string, PluginConfig>;
  hooks: Map<HookType, Array<{ handler: HookHandler; plugin: string; priority: number }>>;
  events: EventEmitter;
}

// Criar estado inicial
const createPluginState = (): PluginState => ({
  plugins: new Map(),
  configs: new Map(),
  hooks: new Map(),
  events: new EventEmitter()
});

// Sistema de plugins funcional
export const createPluginSystem = (rbacInstance: any): PluginSystem => {
  const state = createPluginState();
  
  // Contexto compartilhado
  const context: PluginContext = {
    rbac: rbacInstance,
    logger: (message: string, level: 'info' | 'warn' | 'error' = 'info') => {
      console[level](`[RBAC Plugin] ${message}`);
    },
    events: state.events
  };

  // Instalar plugin
  const install = async (plugin: Plugin, config: PluginConfig = { enabled: true, priority: 50, settings: {} }): Promise<void> => {
    try {
      // Validar plugin primeiro
      validatePlugin(plugin);
      
      context.logger(`Instalando plugin: ${plugin.metadata.name}@${plugin.metadata.version}`, 'info');
      
      // Configurar plugin
      if (plugin.configure) {
        await plugin.configure(config);
      }
      
      // Instalar plugin
      await plugin.install(context);
      
      // Registrar plugin
      state.plugins.set(plugin.metadata.name, plugin);
      state.configs.set(plugin.metadata.name, config);
      
      // Registrar hooks
      if (plugin.getHooks) {
        const hooks = plugin.getHooks();
        for (const [hookType, handler] of Object.entries(hooks)) {
          registerHook(hookType as HookType, handler, plugin.metadata.name, config.priority);
        }
      }
      
      state.events.emit('plugin.installed', {
        type: 'plugin.installed',
        plugin: plugin.metadata.name,
        version: plugin.metadata.version,
        timestamp: new Date()
      });
      
      context.logger(`Plugin ${plugin.metadata.name} instalado com sucesso`, 'info');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const pluginName = plugin.metadata?.name || 'unknown';
      context.logger(`Erro ao instalar plugin ${pluginName}: ${errorMessage}`, 'error');
      
      state.events.emit('plugin.error', {
        type: 'plugin.error',
        plugin: pluginName,
        timestamp: new Date(),
        data: { error: errorMessage }
      });
      
      throw error;
    }
  };

  // Desinstalar plugin
  const uninstall = async (pluginName: string): Promise<void> => {
    const plugin = state.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found`);
    }

    try {
      context.logger(`Desinstalando plugin: ${pluginName}`, 'info');
      
      // Desinstalar plugin
      await plugin.uninstall();
      
      // Remover hooks
      unregisterHooks(pluginName);
      
      // Remover do estado
      state.plugins.delete(pluginName);
      state.configs.delete(pluginName);
      
      state.events.emit('plugin.uninstalled', {
        type: 'plugin.uninstalled',
        plugin: pluginName,
        timestamp: new Date()
      });
      
      context.logger(`Plugin ${pluginName} desinstalado com sucesso`, 'info');
      
    } catch (error) {
      context.logger(`Erro ao desinstalar plugin ${pluginName}: ${error}`, 'error');
      throw error;
    }
  };

  // Habilitar plugin
  const enable = async (pluginName: string): Promise<void> => {
    const config = state.configs.get(pluginName);
    if (!config) {
      throw new Error(`Plugin ${pluginName} não encontrado`);
    }

    config.enabled = true;
    state.configs.set(pluginName, config);
    
    state.events.emit('plugin.enabled', {
      plugin: pluginName,
      timestamp: new Date()
    });
  };

  // Desabilitar plugin
  const disable = async (pluginName: string): Promise<void> => {
    const config = state.configs.get(pluginName);
    if (!config) {
      throw new Error(`Plugin ${pluginName} não encontrado`);
    }

    config.enabled = false;
    state.configs.set(pluginName, config);
    
    state.events.emit('plugin.disabled', {
      plugin: pluginName,
      timestamp: new Date()
    });
  };

  // Executar hooks
  const executeHooks = async (hookType: HookType, data: HookData): Promise<HookData> => {
    const handlers = state.hooks.get(hookType) || [];
    let currentData = { ...data };

    // Filtrar handlers habilitados e ordenar por prioridade
    const enabledHandlers = handlers
      .filter(({ plugin }) => {
        const config = state.configs.get(plugin);
        return config?.enabled;
      })
      .sort((a, b) => b.priority - a.priority);

    for (const { handler, plugin } of enabledHandlers) {
      try {
        const result = await handler(currentData, context);
        if (result) {
          currentData = result;
        }
      } catch (error) {
        context.logger(`Erro no hook ${hookType} do plugin ${plugin}: ${error}`, 'error');
        // Em modo strict, parar execução em caso de erro
        const config = state.configs.get(plugin);
        if (config?.settings?.strictMode) {
          throw error;
        }
        // Continue execution even if hook fails
      }
    }

    return currentData;
  };

  // Obter plugins instalados
  const getPlugins = (): Array<{ name: string; metadata: any; config: PluginConfig }> => {
    const plugins: Array<{ name: string; metadata: any; config: PluginConfig }> = [];
    
    for (const [name, plugin] of state.plugins) {
      const config = state.configs.get(name)!;
      plugins.push({
        name,
        metadata: plugin.metadata,
        config
      });
    }
    
    return plugins;
  };

  // Obter plugin específico
  const getPlugin = (name: string): { plugin: Plugin; config: PluginConfig } | null => {
    const plugin = state.plugins.get(name);
    const config = state.configs.get(name);
    
    if (!plugin || !config) {
      return null;
    }
    
    return { plugin, config };
  };

  // Funções auxiliares

  const validatePlugin = (plugin: Plugin): void => {
    if (!plugin.metadata) {
      throw new Error('Plugin must have metadata');
    }
    
    if (!plugin.metadata.name) {
      throw new Error('Plugin must have a name');
    }
    
    if (!plugin.metadata.version) {
      throw new Error('Plugin must have a version');
    }
    
    if (!plugin.install || typeof plugin.install !== 'function') {
      throw new Error('Plugin must implement install method');
    }
    
    if (!plugin.uninstall || typeof plugin.uninstall !== 'function') {
      throw new Error('Plugin must implement uninstall method');
    }
  };

  const registerHook = (hookType: HookType, handler: HookHandler, plugin: string, priority: number): void => {
    if (!state.hooks.has(hookType)) {
      state.hooks.set(hookType, []);
    }

    state.hooks.get(hookType)!.push({
      handler,
      plugin,
      priority
    });
  };

  const unregisterHooks = (plugin: string): void => {
    for (const [hookType, handlers] of state.hooks) {
      const filteredHandlers = handlers.filter(h => h.plugin !== plugin);
      state.hooks.set(hookType, filteredHandlers);
    }
  };

  return {
    install,
    uninstall,
    enable,
    disable,
    configure: async (pluginName: string, config: PluginConfig): Promise<void> => {
      const plugin = state.plugins.get(pluginName);
      if (!plugin) {
        throw new Error(`Plugin ${pluginName} not found`);
      }
      
      if (plugin.configure) {
        await plugin.configure(config);
      }
      
      state.configs.set(pluginName, config);
    },
    executeHooks,
    getPlugins,
    getPlugin,
    events: state.events
  };
};

// Funções utilitárias para hooks
export const createHookUtils = (system?: PluginSystem) => ({
  // Criar hook de logging
  createLogger: (level: 'info' | 'warn' | 'error' = 'info'): HookHandler => 
    async (data: HookData, context: PluginContext) => {
      context.logger(`Hook executed: ${JSON.stringify(data)}`, level);
    },

  // Criar hook de validação
  createValidator: (validator: (data: HookData) => boolean): HookHandler =>
    async (data: HookData, context: PluginContext) => {
      if (!validator(data)) {
        throw new Error('Validation failed');
      }
      return data;
    },

  // Criar hook modificador
  createModifier: (modifier: (data: HookData) => HookData): HookHandler =>
    async (data: HookData, context: PluginContext) => {
      return modifier(data);
    },

  // Criar hook filtro
  createFilter: (condition: (data: HookData) => boolean): HookHandler =>
    async (data: HookData, context: PluginContext) => {
      if (!condition(data)) {
        return {
          ...data,
          result: false,
          metadata: {
            ...data.metadata,
            reason: 'Filtered out by hook'
          }
        };
      }
      return data;
    },

  // Criar filtro de horário comercial
  createBusinessHoursFilter: (): HookHandler =>
    async (data: HookData, context: PluginContext) => {
      const hour = new Date().getHours();
      const isBusinessHours = hour >= 9 && hour <= 17;
      
      if (!isBusinessHours) {
        return {
          ...data,
          result: false,
          metadata: {
            ...data.metadata,
            reason: 'Access denied outside business hours'
          }
        };
      }
      
      return data;
    },

  // Criar filtro de usuários
  createUserFilter: (allowedUsers: string[]): HookHandler =>
    async (data: HookData, context: PluginContext) => {
      const userId = data.metadata?.userId;
      
      if (userId && !allowedUsers.includes(userId)) {
        return {
          ...data,
          result: false,
          metadata: {
            ...data.metadata,
            reason: 'User not in allowed list'
          }
        };
      }
      
      return data;
    },

  // Criar hook simples
  createHook: (event: string, handler: (data: HookData) => HookData): HookHandler =>
    async (data: HookData, context: PluginContext) => {
      return handler(data);
    },

  // Criar hook condicional
  createConditionalHook: (event: string, condition: (data: HookData) => boolean, handler: (data: HookData) => HookData): HookHandler =>
    async (data: HookData, context: PluginContext) => {
      if (condition(data)) {
        return handler(data);
      }
      return data;
    },

  // Criar hook assíncrono
  createAsyncHook: (event: string, handler: (data: HookData) => Promise<HookData>): HookHandler =>
    async (data: HookData, context: PluginContext) => {
      return await handler(data);
    },

  // Criar handler de erro
  createErrorHandler: (handler: (error: Error, data: HookData) => HookData): HookHandler =>
    async (data: HookData, context: PluginContext) => {
      if (data.error) {
        return handler(data.error, data);
      }
      return data;
    }
});

// Função para criar RBAC com sistema de plugins
export const createRBACWithPlugins = (rbacInstance: any) => {
  const pluginSystem = createPluginSystem(rbacInstance);
  const hookUtils = createHookUtils();

  // Interceptar chamadas do RBAC
  const originalCan = rbacInstance.can.bind(rbacInstance);
  
  const wrappedCan = async (role: string, operation: string | RegExp, params?: any) => {
    let data: HookData = { role, operation, params };

    try {
      // Executar hooks antes da verificação
      data = await pluginSystem.executeHooks('beforePermissionCheck', data);
      
      // Verificar se foi negado por algum hook
      if (data.result === false) {
        return false;
      }

      // Executar verificação original
      const result = await originalCan(role, operation, params);
      
      // Executar hooks após a verificação
      data = await pluginSystem.executeHooks('afterPermissionCheck', {
        ...data,
        result
      });

      return data.result !== undefined ? data.result : result;

    } catch (error) {
      // Executar hooks de erro
      await pluginSystem.executeHooks('onError', {
        ...data,
        error: error as Error
      });
      throw error;
    }
  };

  // Interceptar updateRoles
  const originalUpdateRoles = rbacInstance.updateRoles.bind(rbacInstance);
  const wrappedUpdateRoles = (roles: any) => {
    const data: HookData = { role: 'admin', operation: 'update', params: roles };
    pluginSystem.executeHooks('beforeRoleUpdate', data);
    const result = originalUpdateRoles(roles);
    pluginSystem.executeHooks('afterRoleUpdate', data);
    return result;
  };

  // Interceptar addRole
  const originalAddRole = rbacInstance.addRole.bind(rbacInstance);
  const wrappedAddRole = (roleName: string, role: any) => {
    const data: HookData = { role: roleName, operation: 'add', params: role };
    pluginSystem.executeHooks('beforeRoleAdd', data);
    const result = originalAddRole(roleName, role);
    pluginSystem.executeHooks('afterRoleAdd', data);
    return result;
  };

  return {
    ...rbacInstance,
    can: wrappedCan,
    updateRoles: wrappedUpdateRoles,
    addRole: wrappedAddRole,
    pluginSystem: pluginSystem,
    hooks: hookUtils
  };
};
