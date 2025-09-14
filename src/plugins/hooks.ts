import { EventEmitter } from 'events';
import { PluginHook, HookData, PluginContext, RBACPlugin } from './types';

/**
 * Sistema de hooks para interceptar e modificar o comportamento do RBAC
 */
export class HookSystem<P = unknown> extends EventEmitter {
  private hooks: Map<PluginHook, Array<{
    handler: (data: HookData<P>, context: PluginContext<P>) => Promise<HookData<P> | void>;
    plugin: string;
    priority: number;
  }>> = new Map();

  constructor() {
    super();
    this.initializeHooks();
  }

  /**
   * Registra um hook
   */
  registerHook(
    hookName: PluginHook,
    handler: (data: HookData<P>, context: PluginContext<P>) => Promise<HookData<P> | void>,
    plugin: string,
    priority: number = 50
  ): void {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }

    this.hooks.get(hookName)!.push({
      handler,
      plugin,
      priority
    });

    // Ordenar por prioridade (maior primeiro)
    this.hooks.get(hookName)!.sort((a, b) => b.priority - a.priority);

    this.emit('hook.registered', { hookName, plugin, priority });
  }

  /**
   * Remove hooks de um plugin específico
   */
  unregisterPluginHooks(plugin: string): void {
    for (const [hookName, handlers] of this.hooks) {
      const filteredHandlers = handlers.filter(h => h.plugin !== plugin);
      this.hooks.set(hookName, filteredHandlers);
    }

    this.emit('hooks.unregistered', { plugin });
  }

  /**
   * Executa hooks de um tipo específico
   */
  async executeHooks(
    hookName: PluginHook,
    data: HookData<P>,
    context: PluginContext<P>
  ): Promise<HookData<P>> {
    const handlers = this.hooks.get(hookName) || [];
    let currentData = { ...data };

    this.emit('hooks.beforeExecute', { hookName, data: currentData });

    for (const { handler, plugin, priority } of handlers) {
      try {
        this.emit('hook.beforeExecute', { hookName, plugin, priority, data: currentData });

        const startTime = Date.now();
        const result = await handler(currentData, context);
        const executionTime = Date.now() - startTime;

        this.emit('hook.afterExecute', { 
          hookName, 
          plugin, 
          priority, 
          data: currentData, 
          result,
          executionTime 
        });

        // Se o hook retornou dados modificados, usar para próxima iteração
        if (result) {
          currentData = result;
        }

      } catch (error) {
        this.emit('hook.error', { 
          hookName, 
          plugin, 
          priority, 
          error: error.message,
          data: currentData 
        });

        // Em modo strict, parar execução em caso de erro
        if (context.config.settings?.strictMode) {
          throw error;
        }
      }
    }

    this.emit('hooks.afterExecute', { hookName, data: currentData });

    return currentData;
  }

  /**
   * Lista todos os hooks registrados
   */
  getRegisteredHooks(): Record<PluginHook, Array<{ plugin: string; priority: number }>> {
    const result: Record<string, Array<{ plugin: string; priority: number }>> = {};

    for (const [hookName, handlers] of this.hooks) {
      result[hookName] = handlers.map(({ plugin, priority }) => ({ plugin, priority }));
    }

    return result as Record<PluginHook, Array<{ plugin: string; priority: number }>>;
  }

  /**
   * Verifica se um hook específico tem handlers registrados
   */
  hasHooks(hookName: PluginHook): boolean {
    return this.hooks.has(hookName) && this.hooks.get(hookName)!.length > 0;
  }

  /**
   * Conta quantos handlers um hook tem
   */
  getHookCount(hookName: PluginHook): number {
    return this.hooks.get(hookName)?.length || 0;
  }

  private initializeHooks(): void {
    // Inicializar todos os tipos de hooks com arrays vazios
    const hookTypes: PluginHook[] = [
      'beforePermissionCheck',
      'afterPermissionCheck',
      'beforeRoleUpdate',
      'afterRoleUpdate',
      'beforeRoleAdd',
      'afterRoleAdd',
      'onError',
      'onStartup',
      'onShutdown'
    ];

    for (const hookType of hookTypes) {
      this.hooks.set(hookType, []);
    }
  }
}

/**
 * Utilitários para hooks comuns
 */
export class HookUtils {
  /**
   * Cria um hook que modifica o resultado de uma verificação de permissão
   */
  static createPermissionModifier(
    condition: (data: HookData<any>) => boolean,
    modifier: (data: HookData<any>) => HookData<any>
  ) {
    return async (data: HookData<any>, context: PluginContext<any>): Promise<HookData<any> | void> => {
      if (condition(data)) {
        return modifier(data);
      }
      return data;
    };
  }

  /**
   * Cria um hook que adiciona logging
   */
  static createLogger(logLevel: 'info' | 'warn' | 'error' = 'info') {
    return async (data: HookData<any>, context: PluginContext<any>): Promise<void> => {
      context.logger(`Hook executed: ${JSON.stringify(data)}`, logLevel);
    };
  }

  /**
   * Cria um hook que valida dados antes de processar
   */
  static createValidator(validator: (data: HookData<any>) => boolean) {
    return async (data: HookData<any>, context: PluginContext<any>): Promise<HookData<any> | void> => {
      if (!validator(data)) {
        throw new Error('Validation failed');
      }
      return data;
    };
  }

  /**
   * Cria um hook que adiciona metadados
   */
  static createMetadataAdder(metadata: Record<string, any>) {
    return async (data: HookData<any>, context: PluginContext<any>): Promise<HookData<any>> => {
      return {
        ...data,
        metadata: {
          ...data.metadata,
          ...metadata
        }
      };
    };
  }

  /**
   * Cria um hook que executa apenas em horário comercial
   */
  static createBusinessHoursFilter() {
    return async (data: HookData<any>, context: PluginContext<any>): Promise<HookData<any> | void> => {
      const hour = new Date().getHours();
      const isBusinessHours = hour >= 9 && hour <= 17;
      
      if (!isBusinessHours) {
        // Modificar resultado para negar acesso fora do horário comercial
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
    };
  }

  /**
   * Cria um hook que executa apenas para usuários específicos
   */
  static createUserFilter(allowedUsers: string[]) {
    return async (data: HookData<any>, context: PluginContext<any>): Promise<HookData<any> | void> => {
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
    };
  }
}
