// Sistema de plugins funcional para RBAC

// Exportar tipos
export * from './functional-types';

// Exportar sistema principal
export { 
  createPluginSystem, 
  createRBACWithPlugins, 
  createHookUtils 
} from './functional-plugin-system';

// Exportar sistema de plugins da comunidade
export { 
  PluginLoader,
  type PluginPackage 
} from './plugin-loader';

export { 
  createRBACWithAutoPlugins,
  loadSpecificPlugins,
  listAvailablePlugins,
  getPluginStatus,
  type AutoPluginOptions 
} from './auto-plugin-loader';

export { 
  PluginValidator,
  type ValidationResult,
  type SecurityResult 
} from './plugin-validator';

export { 
  PluginCLI,
  runCLI 
} from './cli';

// Exportar template para plugins da comunidade
export { 
  createPlugin as createCommunityPlugin,
  type CommunityPluginConfig 
} from './community-template';

// Exportar plugins de exemplo
export { createCachePlugin } from './functional-examples/cache-plugin';
export { createNotificationPlugin } from './functional-examples/notification-plugin';
export { createValidationPlugin } from './functional-examples/validation-plugin';

// Exportar exemplos de uso
export { 
  createExpressMiddlewarePlugin, 
  createRedisCachePlugin 
} from './functional-examples/usage-example';

// Re-exportar RBAC original
export { default as RBAC } from '../rbac';
