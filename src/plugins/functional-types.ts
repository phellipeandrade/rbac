// Tipos funcionais para o sistema de plugins

export interface PluginMetadata {
  name: string;
  version: string;
  description: string;
  author: string;
  license?: string;
  keywords?: string[];
}

export interface PluginConfig {
  enabled: boolean;
  priority: number;
  settings: Record<string, any>;
}

export interface PluginContext {
  rbac: {
    can: (role: string, operation: string | RegExp, params?: any) => Promise<boolean>;
    updateRoles: (roles: any) => void;
    addRole: (roleName: string, role: any) => void;
  };
  logger: (message: string, level?: 'info' | 'warn' | 'error') => void;
  events: {
    on: (event: string, handler: (data: any) => void) => void;
    emit: (event: string, data: any) => void;
  };
}

export type HookType = 
  | 'beforePermissionCheck'
  | 'afterPermissionCheck'
  | 'beforeRoleUpdate'
  | 'afterRoleUpdate'
  | 'beforeRoleAdd'
  | 'afterRoleAdd'
  | 'onError';

export interface HookData {
  role: string;
  operation: string | RegExp;
  params?: any;
  result?: boolean;
  error?: Error;
  metadata?: Record<string, any>;
}

export type HookHandler = (data: HookData, context: PluginContext) => Promise<HookData | void>;

// Definição funcional de um plugin
export interface Plugin {
  metadata: PluginMetadata;
  install: (context: PluginContext) => Promise<void> | void;
  uninstall: () => Promise<void> | void;
  configure?: (config: PluginConfig) => Promise<void> | void;
  getHooks?: () => Record<HookType, HookHandler>;
}

// Funções utilitárias para plugins
export type PluginFactory = (config?: PluginConfig) => Plugin;

// Sistema de plugins funcional
export interface PluginSystem {
  install: (plugin: Plugin, config?: PluginConfig) => Promise<void>;
  uninstall: (pluginName: string) => Promise<void>;
  enable: (pluginName: string) => Promise<void>;
  disable: (pluginName: string) => Promise<void>;
  executeHooks: (hookType: HookType, data: HookData) => Promise<HookData>;
  getPlugins: () => Array<{ name: string; metadata: PluginMetadata; config: PluginConfig }>;
  getPlugin: (name: string) => { plugin: Plugin; config: PluginConfig } | null;
}

// Hooks utilitários funcionais
export interface HookUtils {
  createLogger: (level?: 'info' | 'warn' | 'error') => HookHandler;
  createValidator: (validator: (data: HookData) => boolean) => HookHandler;
  createModifier: (modifier: (data: HookData) => HookData) => HookHandler;
  createFilter: (condition: (data: HookData) => boolean) => HookHandler;
  createBusinessHoursFilter: () => HookHandler;
  createUserFilter: (allowedUsers: string[]) => HookHandler;
}
