// Tipos base para o sistema de plugins
export interface PluginMetadata {
  name: string;
  version: string;
  description: string;
  author: string;
  license?: string;
  homepage?: string;
  repository?: string;
  keywords?: string[];
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  rbacVersion?: string;
}

export interface PluginConfig {
  enabled: boolean;
  priority: number; // 0-100, maior número = maior prioridade
  settings: Record<string, any>;
}

export interface PluginContext<P = unknown> {
  rbac: {
    can: (role: string, operation: string | RegExp, params?: P) => Promise<boolean>;
    updateRoles: (roles: any) => void;
    addRole: (roleName: string, role: any) => void;
  };
  config: PluginConfig;
  logger: (message: string, level?: 'info' | 'warn' | 'error') => void;
  events: EventEmitter;
}

// Hooks disponíveis para plugins
export type PluginHook<P = unknown> = 
  | 'beforePermissionCheck'
  | 'afterPermissionCheck'
  | 'beforeRoleUpdate'
  | 'afterRoleUpdate'
  | 'beforeRoleAdd'
  | 'afterRoleAdd'
  | 'onError'
  | 'onStartup'
  | 'onShutdown';

export interface HookData<P = unknown> {
  role: string;
  operation: string | RegExp;
  params?: P;
  result?: boolean;
  error?: Error;
  metadata?: Record<string, any>;
}

export interface PluginHookHandler<P = unknown> {
  (data: HookData<P>, context: PluginContext<P>): Promise<HookData<P> | void>;
}

// Interface base que todos os plugins devem implementar
export interface RBACPlugin<P = unknown> {
  metadata: PluginMetadata;
  
  // Métodos obrigatórios
  install(context: PluginContext<P>): Promise<void> | void;
  uninstall(): Promise<void> | void;
  
  // Métodos opcionais
  configure?(config: PluginConfig): Promise<void> | void;
  getHooks?(): Record<PluginHook<P>, PluginHookHandler<P>>;
  
  // Métodos de ciclo de vida
  onStartup?(): Promise<void> | void;
  onShutdown?(): Promise<void> | void;
}

// Tipos para diferentes categorias de plugins
export interface MiddlewarePlugin<P = unknown> extends RBACPlugin<P> {
  createMiddleware(): (req: any, res: any, next: any) => void;
}

export interface ValidationPlugin<P = unknown> extends RBACPlugin<P> {
  validatePermission(role: string, operation: string, params?: P): Promise<boolean>;
  validateRole(role: any): Promise<boolean>;
}

export interface CachePlugin<P = unknown> extends RBACPlugin<P> {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface NotificationPlugin<P = unknown> extends RBACPlugin<P> {
  notify(event: string, data: any): Promise<void>;
  subscribe(event: string, handler: (data: any) => void): void;
  unsubscribe(event: string, handler: (data: any) => void): void;
}

export interface AuditPlugin<P = unknown> extends RBACPlugin<P> {
  log(event: string, data: any): Promise<void>;
  getLogs(filters?: any): Promise<any[]>;
}

export interface StoragePlugin<P = unknown> extends RBACPlugin<P> {
  save(key: string, data: any): Promise<void>;
  load(key: string): Promise<any>;
  delete(key: string): Promise<void>;
  list(): Promise<string[]>;
}

// Eventos do sistema de plugins
export interface PluginEvent {
  type: 'plugin.installed' | 'plugin.uninstalled' | 'plugin.enabled' | 'plugin.disabled' | 'plugin.error';
  plugin: string;
  timestamp: Date;
  data?: any;
}

// Configuração do sistema de plugins
export interface PluginSystemConfig {
  pluginsDirectory?: string;
  autoLoad?: boolean;
  strictMode?: boolean; // Se true, falha se plugin não carregar
  enableHotReload?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

// Resultado da execução de hooks
export interface HookResult<P = unknown> {
  success: boolean;
  data?: HookData<P>;
  error?: Error;
  plugin: string;
  executionTime: number;
}

// Registry de plugins
export interface PluginRegistry {
  plugins: Map<string, RBACPlugin>;
  configs: Map<string, PluginConfig>;
  hooks: Map<PluginHook, PluginHookHandler[]>;
  events: EventEmitter;
}

// Import do EventEmitter do Node.js
import { EventEmitter } from 'events';
