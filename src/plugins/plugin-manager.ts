import { EventEmitter } from 'events';
import { 
  RBACPlugin, 
  PluginContext, 
  PluginConfig, 
  PluginMetadata, 
  PluginHook, 
  HookData, 
  PluginSystemConfig,
  PluginRegistry,
  HookResult
} from './types';

export class PluginManager<P = unknown> extends EventEmitter {
  private registry: PluginRegistry;
  private context: PluginContext<P>;
  private config: PluginSystemConfig;

  constructor(rbacInstance: any, config: PluginSystemConfig = {}) {
    super();
    
    this.config = {
      pluginsDirectory: './plugins',
      autoLoad: false,
      strictMode: false,
      enableHotReload: false,
      logLevel: 'info',
      ...config
    };

    this.registry = {
      plugins: new Map<string, RBACPlugin<any>>(),
      configs: new Map(),
      hooks: new Map(),
      events: new EventEmitter()
    };

    this.context = {
      rbac: rbacInstance,
      config: { enabled: true, priority: 50, settings: {} },
      logger: this.logger.bind(this),
      events: this.registry.events
    };

    this.setupEventHandlers();
  }

  /**
   * Instala um plugin
   */
  async installPlugin(plugin: RBACPlugin<P>, config: PluginConfig = { enabled: true, priority: 50, settings: {} }): Promise<void> {
    try {
      this.logger(`Instalando plugin: ${plugin.metadata.name}@${plugin.metadata.version}`, 'info');
      
      // Validar plugin
      this.validatePlugin(plugin);
      
      // Verificar dependências
      await this.checkDependencies(plugin);
      
      // Configurar plugin
      if (plugin.configure) {
        await plugin.configure(config);
      }
      
      // Instalar plugin
      await plugin.install(this.context);
      
      // Registrar plugin
      this.registry.plugins.set(plugin.metadata.name, plugin as RBACPlugin<any>);
      this.registry.configs.set(plugin.metadata.name, config);
      
      // Registrar hooks
      if (plugin.getHooks) {
        const hooks = plugin.getHooks();
        for (const [hookName, handler] of Object.entries(hooks)) {
          this.registerHook(hookName as PluginHook, handler);
        }
      }
      
      // Executar onStartup se disponível
      if (plugin.onStartup) {
        await plugin.onStartup();
      }
      
      this.emit('plugin.installed', {
        type: 'plugin.installed',
        plugin: plugin.metadata.name,
        timestamp: new Date(),
        data: { version: plugin.metadata.version }
      });
      
      this.logger(`Plugin ${plugin.metadata.name} instalado com sucesso`, 'info');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger(`Erro ao instalar plugin ${plugin.metadata.name}: ${errorMessage}`, 'error');
      this.emit('plugin.error', {
        type: 'plugin.error',
        plugin: plugin.metadata.name,
        timestamp: new Date(),
        data: { error: errorMessage }
      });
      
      if (this.config.strictMode) {
        throw error;
      }
    }
  }

  /**
   * Desinstala um plugin
   */
  async uninstallPlugin(pluginName: string): Promise<void> {
    const plugin = this.registry.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} não encontrado`);
    }

    try {
      this.logger(`Desinstalando plugin: ${pluginName}`, 'info');
      
      // Executar onShutdown se disponível
      if (plugin.onShutdown) {
        await plugin.onShutdown();
      }
      
      // Desinstalar plugin
      await plugin.uninstall();
      
      // Remover hooks
      this.unregisterHooks(pluginName);
      
      // Remover do registry
      this.registry.plugins.delete(pluginName);
      this.registry.configs.delete(pluginName);
      
      this.emit('plugin.uninstalled', {
        type: 'plugin.uninstalled',
        plugin: pluginName,
        timestamp: new Date()
      });
      
      this.logger(`Plugin ${pluginName} desinstalado com sucesso`, 'info');
      
    } catch (error) {
      this.logger(`Erro ao desinstalar plugin ${pluginName}: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Habilita um plugin
   */
  async enablePlugin(pluginName: string): Promise<void> {
    const config = this.registry.configs.get(pluginName);
    if (!config) {
      throw new Error(`Plugin ${pluginName} não encontrado`);
    }

    config.enabled = true;
    this.registry.configs.set(pluginName, config);
    
    this.emit('plugin.enabled', {
      type: 'plugin.enabled',
      plugin: pluginName,
      timestamp: new Date()
    });
  }

  /**
   * Desabilita um plugin
   */
  async disablePlugin(pluginName: string): Promise<void> {
    const config = this.registry.configs.get(pluginName);
    if (!config) {
      throw new Error(`Plugin ${pluginName} não encontrado`);
    }

    config.enabled = false;
    this.registry.configs.set(pluginName, config);
    
    this.emit('plugin.disabled', {
      type: 'plugin.disabled',
      plugin: pluginName,
      timestamp: new Date()
    });
  }

  /**
   * Executa hooks de um tipo específico
   */
  async executeHooks(hookName: PluginHook, data: HookData<P>): Promise<HookResult<P>[]> {
    const handlers = this.registry.hooks.get(hookName) || [];
    const results: HookResult<P>[] = [];

    // Ordenar por prioridade
    const sortedHandlers = handlers
      .map(handler => ({
        handler,
        plugin: this.findPluginByHandler(handler),
        priority: this.registry.configs.get(this.findPluginByHandler(handler) || '')?.priority || 50
      }))
      .filter(item => item.plugin && this.registry.configs.get(item.plugin)?.enabled)
      .sort((a, b) => b.priority - a.priority);

    for (const { handler, plugin } of sortedHandlers) {
      const startTime = Date.now();
      
      try {
        const result = await handler(data, this.context as any);
        const executionTime = Date.now() - startTime;
        
        results.push({
          success: true,
          data: result as HookData<P>,
          plugin: plugin!,
          executionTime
        });
        
        // Se o hook retornou dados modificados, usar para próxima iteração
        if (result) {
          data = result as HookData<P>;
        }
        
      } catch (error) {
        const executionTime = Date.now() - startTime;
        
        results.push({
          success: false,
          error: error as Error,
          plugin: plugin!,
          executionTime
        });
        
        this.logger(`Erro no hook ${hookName} do plugin ${plugin}: ${error}`, 'error');
      }
    }

    return results;
  }

  /**
   * Lista todos os plugins instalados
   */
  getInstalledPlugins(): Array<{ name: string; metadata: PluginMetadata; config: PluginConfig }> {
    const plugins: Array<{ name: string; metadata: PluginMetadata; config: PluginConfig }> = [];
    
    for (const [name, plugin] of this.registry.plugins) {
      const config = this.registry.configs.get(name)!;
      plugins.push({
        name,
        metadata: plugin.metadata,
        config
      });
    }
    
    return plugins;
  }

  /**
   * Obtém informações de um plugin específico
   */
  getPlugin(pluginName: string): { plugin: RBACPlugin<P>; config: PluginConfig } | null {
    const plugin = this.registry.plugins.get(pluginName);
    const config = this.registry.configs.get(pluginName);
    
    if (!plugin || !config) {
      return null;
    }
    
    return { plugin: plugin as RBACPlugin<P>, config };
  }

  /**
   * Atualiza configuração de um plugin
   */
  async updatePluginConfig(pluginName: string, newConfig: Partial<PluginConfig>): Promise<void> {
    const currentConfig = this.registry.configs.get(pluginName);
    if (!currentConfig) {
      throw new Error(`Plugin ${pluginName} não encontrado`);
    }

    const updatedConfig = { ...currentConfig, ...newConfig };
    this.registry.configs.set(pluginName, updatedConfig);
    
    const plugin = this.registry.plugins.get(pluginName);
    if (plugin?.configure) {
      await plugin.configure(updatedConfig);
    }
  }

  /**
   * Carrega plugins de um diretório
   */
  async loadPluginsFromDirectory(directory: string): Promise<void> {
    // Implementação seria feita com fs e require/dynamic import
    // Por simplicidade, deixamos como placeholder
    this.logger(`Carregando plugins do diretório: ${directory}`, 'info');
  }

  // Métodos privados

  private validatePlugin(plugin: RBACPlugin<P>): void {
    if (!plugin.metadata) {
      throw new Error('Plugin deve ter metadata');
    }
    
    if (!plugin.metadata.name) {
      throw new Error('Plugin deve ter um nome');
    }
    
    if (!plugin.metadata.version) {
      throw new Error('Plugin deve ter uma versão');
    }
    
    if (!plugin.install || typeof plugin.install !== 'function') {
      throw new Error('Plugin deve implementar o método install');
    }
    
    if (!plugin.uninstall || typeof plugin.uninstall !== 'function') {
      throw new Error('Plugin deve implementar o método uninstall');
    }
  }

  private async checkDependencies(plugin: RBACPlugin<P>): Promise<void> {
    if (!plugin.metadata.dependencies) {
      return;
    }

    // Verificar se dependências estão instaladas
    for (const [depName, depVersion] of Object.entries(plugin.metadata.dependencies)) {
      try {
        require.resolve(depName);
      } catch {
        throw new Error(`Dependência ${depName}@${depVersion} não encontrada`);
      }
    }
  }

  private registerHook(hookName: PluginHook, handler: any): void {
    if (!this.registry.hooks.has(hookName)) {
      this.registry.hooks.set(hookName, []);
    }
    
    this.registry.hooks.get(hookName)!.push(handler);
  }

  private unregisterHooks(pluginName: string): void {
    // Remover todos os hooks do plugin
    for (const [hookName, handlers] of this.registry.hooks) {
      const filteredHandlers = handlers.filter(handler => 
        this.findPluginByHandler(handler) !== pluginName
      );
      this.registry.hooks.set(hookName, filteredHandlers);
    }
  }

  private findPluginByHandler(handler: any): string | null {
    for (const [name, plugin] of this.registry.plugins) {
      if (plugin.getHooks) {
        const hooks = plugin.getHooks();
        for (const h of Object.values(hooks)) {
          if (h === handler) {
            return name;
          }
        }
      }
    }
    return null;
  }

  private setupEventHandlers(): void {
    this.registry.events.on('error', (error) => {
      this.logger(`Erro no sistema de plugins: ${error}`, 'error');
    });
  }

  private logger(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    if (this.shouldLog(level)) {
      console[level](`[RBAC Plugin Manager] ${message}`);
    }
  }

  private shouldLog(level: string): boolean {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const configLevel = levels[this.config.logLevel as keyof typeof levels] || 1;
    const messageLevel = levels[level as keyof typeof levels] || 1;
    return messageLevel >= configLevel;
  }
}
