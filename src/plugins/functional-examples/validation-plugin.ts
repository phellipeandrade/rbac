import { Plugin, PluginConfig, PluginContext, HookData, HookType } from '../functional-types';

// Estado da validação
interface ValidationState {
  config: {
    strictMode: boolean;
    validateRoles: boolean;
    validateOperations: boolean;
    validateParams: boolean;
  };
  rules: Array<{
    field: string;
    validator: (value: any) => boolean;
    message: string;
    required?: boolean;
  }>;
  patterns: {
    role: RegExp;
    operation: RegExp;
  };
  stats: {
    validations: number;
    errors: number;
  };
}

// Criar estado inicial da validação
const createValidationState = (config: any): ValidationState => ({
  config: {
    strictMode: false,
    validateRoles: true,
    validateOperations: true,
    validateParams: true,
    ...config
  },
  rules: [],
  patterns: {
    role: /^[a-zA-Z][a-zA-Z0-9_-]*$/,
    operation: /^[a-zA-Z][a-zA-Z0-9_:.-]*$/
  },
  stats: {
    validations: 0,
    errors: 0
  }
});

// Plugin de validação funcional
export const createValidationPlugin = (config: PluginConfig = { enabled: true, priority: 50, settings: {} }): Plugin => {
  let state: ValidationState | null = null;

  return {
    metadata: {
      name: 'rbac-validation',
      version: '1.0.0',
      description: 'validation plugin for RBAC roles, operations and parameters',
      author: 'RBAC Team',
      license: 'MIT',
      keywords: ['validation', 'security', 'data-integrity']
    },

    install: async (context: PluginContext) => {
      state = createValidationState(config.settings);
      context.logger('ValidationPlugin installed', 'info');
      setupDefaultRules(state);
    },

    uninstall: () => {
      if (state) {
        state.rules = [];
        state = null;
      }
    },

    configure: (newConfig: PluginConfig) => {
      if (state && newConfig.settings) {
        state.config = { ...state.config, ...newConfig.settings };
      }
    },

    getHooks: () => ({
      beforePermissionCheck: async (data: HookData, context: PluginContext) => {
        if (!state) return data;

        try {
          state.stats.validations++;

          // Validar role
          if (state.config.validateRoles) {
            validateRole(data.role, state);
          }

          // Validar operação
          if (state.config.validateOperations) {
            validateOperation(data.operation, state);
          }

          // Validar parâmetros
          if (state.config.validateParams && data.params) {
            validateParams(data.params, state);
          }

          return data;
        } catch (error) {
          state.stats.errors++;
          context.logger(`Erro de validação: ${(error as Error).message}`, 'error');
          
          if (state.config.strictMode) {
            throw error;
          }

          return {
            ...data,
            result: false,
            metadata: {
              ...data.metadata,
              validationError: (error as Error).message
            }
          };
        }
      },

      afterPermissionCheck: async (data: HookData, context: PluginContext) => data,

      beforeRoleUpdate: async (data: HookData, context: PluginContext) => {
        if (!state) return data;

        try {
          // Validar estrutura dos roles
          if (data.metadata?.roles) {
            validateRolesStructure(data.metadata.roles, state);
          }

          return data;
        } catch (error) {
          state.stats.errors++;
          context.logger(`Erro de validação de roles: ${(error as Error).message}`, 'error');
          
          if (state.config.strictMode) {
            throw error;
          }

          return {
            ...data,
            result: false,
            metadata: {
              ...data.metadata,
              validationError: (error as Error).message
            }
          };
        }
      },

      afterRoleUpdate: async (data: HookData, context: PluginContext) => data,

      beforeRoleAdd: async (data: HookData, context: PluginContext) => {
        if (!state) return data;

        try {
          // Validar nome do role
          if (data.metadata?.roleName) {
            validateRole(data.metadata.roleName, state);
          }

          // Validar estrutura do role
          if (data.metadata?.roleDefinition) {
            validateRoleDefinition(data.metadata.roleDefinition, state);
          }

          return data;
        } catch (error) {
          state.stats.errors++;
          context.logger(`Erro de validação de role: ${(error as Error).message}`, 'error');
          
          if (state.config.strictMode) {
            throw error;
          }

          return {
            ...data,
            result: false,
            metadata: {
              ...data.metadata,
              validationError: (error as Error).message
            }
          };
        }
      },

      afterRoleAdd: async (data: HookData, context: PluginContext) => data,
      onError: async (data: HookData, context: PluginContext) => data
    })
  };
};

// Funções de validação

const validateRole = (role: string, state: ValidationState): void => {
  if (!role || typeof role !== 'string') {
    throw new Error('Role deve ser uma string não vazia');
  }

  if (!state.patterns.role.test(role)) {
    throw new Error(`Role '${role}' deve conter apenas letras, números, hífens e underscores, e começar com letra`);
  }

  if (role.length > 50) {
    throw new Error(`Role '${role}' deve ter no máximo 50 caracteres`);
  }
};

const validateOperation = (operation: string | RegExp, state: ValidationState): void => {
  if (typeof operation === 'string') {
    if (!operation || operation.trim() === '') {
      throw new Error('Operação deve ser uma string não vazia');
    }

    if (!state.patterns.operation.test(operation)) {
      throw new Error(`Operação '${operation}' deve conter apenas letras, números, dois pontos, pontos e hífens, e começar com letra`);
    }

    if (operation.length > 100) {
      throw new Error(`Operação '${operation}' deve ter no máximo 100 caracteres`);
    }
  } else if (operation instanceof RegExp) {
    // Validar regex
    try {
      new RegExp(operation.source, operation.flags);
    } catch (error) {
      throw new Error(`Regex inválida: ${(error as Error).message}`);
    }
  } else {
    throw new Error('Operação deve ser uma string ou RegExp');
  }
};

const validateParams = (params: any, state: ValidationState): void => {
  if (params === null || params === undefined) {
    return;
  }

  if (typeof params !== 'object') {
    throw new Error('Parâmetros devem ser um objeto');
  }

  // Aplicar regras de validação customizadas
  for (const rule of state.rules) {
    const value = params[rule.field];
    
    if (rule.required && (value === undefined || value === null)) {
      throw new Error(`Campo '${rule.field}' é obrigatório`);
    }

    if (value !== undefined && value !== null && !rule.validator(value)) {
      throw new Error(rule.message);
    }
  }
};

const validateRolesStructure = (roles: any, state: ValidationState): void => {
  if (!roles || typeof roles !== 'object') {
    throw new Error('Roles devem ser um objeto');
  }

  for (const [roleName, roleDef] of Object.entries(roles)) {
    validateRole(roleName, state);
    validateRoleDefinition(roleDef, state);
  }
};

const validateRoleDefinition = (roleDef: any, state: ValidationState): void => {
  if (!roleDef || typeof roleDef !== 'object') {
    throw new Error('Definição de role deve ser um objeto');
  }

  if (!Array.isArray(roleDef.can)) {
    throw new Error('Propriedade "can" deve ser um array');
  }

  for (const permission of roleDef.can) {
    if (typeof permission === 'string') {
      validateOperation(permission, state);
    } else if (typeof permission === 'object' && permission.name) {
      validateOperation(permission.name, state);
      
      if (permission.when && typeof permission.when !== 'function') {
        throw new Error('Propriedade "when" deve ser uma função');
      }
    } else {
      throw new Error('Permissão deve ser uma string ou objeto com propriedade "name"');
    }
  }

  if (roleDef.inherits) {
    if (!Array.isArray(roleDef.inherits)) {
      throw new Error('Propriedade "inherits" deve ser um array');
    }

    for (const inheritedRole of roleDef.inherits) {
      validateRole(inheritedRole, state);
    }
  }
};

const setupDefaultRules = (state: ValidationState): void => {
  // Regras padrão podem ser adicionadas aqui
};

// Funções utilitárias para validação

export const createValidationUtils = (plugin: Plugin) => {
  return {
    addEmailValidation: (field: string, required: boolean = false) => {
      // Implementar validação de email
    },
    addUrlValidation: (field: string, required: boolean = false) => {
      // Implementar validação de URL
    },
    addNumericValidation: (field: string, min?: number, max?: number, required: boolean = false) => {
      // Implementar validação numérica
    },
    addStringValidation: (field: string, minLength?: number, maxLength?: number, required: boolean = false) => {
      // Implementar validação de string
    },
    getStats: () => ({
      validations: 0,
      errors: 0,
      rules: 0
    })
  };
};
