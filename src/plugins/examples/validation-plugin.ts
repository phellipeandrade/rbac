import { RBACPlugin, PluginContext, PluginConfig, PluginMetadata, HookData } from '../types';

interface ValidationConfig {
  strictMode: boolean;
  validateRoles: boolean;
  validateOperations: boolean;
  validateParams: boolean;
  customValidators: Record<string, (value: any) => boolean>;
}

interface ValidationRule {
  field: string;
  validator: (value: any) => boolean;
  message: string;
  required?: boolean;
}

/**
 * Plugin de validação para roles, operações e parâmetros
 */
export class ValidationPlugin<P = unknown> implements RBACPlugin<P> {
  metadata: PluginMetadata = {
    name: 'rbac-validation',
    version: '1.0.0',
    description: 'Plugin de validação para roles, operações e parâmetros do RBAC',
    author: 'RBAC Team',
    license: 'MIT',
    keywords: ['validation', 'security', 'data-integrity']
  };

  private config: ValidationConfig = {
    strictMode: false,
    validateRoles: true,
    validateOperations: true,
    validateParams: true,
    customValidators: {}
  };

  private validationRules: ValidationRule[] = [];
  private rolePattern = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
  private operationPattern = /^[a-zA-Z][a-zA-Z0-9_:.-]*$/;

  async install(context: PluginContext<P>): Promise<void> {
    context.logger('ValidationPlugin instalado', 'info');
    this.setupDefaultRules();
  }

  async uninstall(): Promise<void> {
    this.validationRules = [];
  }

  configure(config: PluginConfig): void {
    if (config.settings) {
      this.config = { ...this.config, ...config.settings };
    }
  }

  getHooks() {
    return {
      beforePermissionCheck: this.beforePermissionCheck.bind(this),
      afterPermissionCheck: this.afterPermissionCheck.bind(this),
      beforeRoleUpdate: this.beforeRoleUpdate.bind(this),
      afterRoleUpdate: this.afterRoleUpdate.bind(this),
      beforeRoleAdd: this.beforeRoleAdd.bind(this),
      afterRoleAdd: this.afterRoleAdd.bind(this),
      onError: this.onError.bind(this),
      onStartup: this.onStartup.bind(this),
      onShutdown: this.onShutdown.bind(this)
    };
  }

  private async beforePermissionCheck(data: HookData<P>, context: PluginContext<P>): Promise<HookData<P> | void> {
    try {
      // Validar role
      if (this.config.validateRoles) {
        this.validateRole(data.role);
      }

      // Validar operação
      if (this.config.validateOperations) {
        this.validateOperation(data.operation);
      }

      // Validar parâmetros
      if (this.config.validateParams && data.params) {
        this.validateParams(data.params);
      }

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      context.logger(`Erro de validação: ${errorMessage}`, 'error');
      
      if (this.config.strictMode) {
        throw error;
      }

      return {
        ...data,
        result: false,
        metadata: {
          ...data.metadata,
          validationError: errorMessage
        }
      };
    }
  }

  private async beforeRoleUpdate(data: HookData<P>, context: PluginContext<P>): Promise<HookData<P> | void> {
    try {
      // Validar estrutura dos roles
      if (data.metadata?.roles) {
        this.validateRolesStructure(data.metadata.roles);
      }

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      context.logger(`Erro de validação de roles: ${errorMessage}`, 'error');
      
      if (this.config.strictMode) {
        throw error;
      }

      return {
        ...data,
        result: false,
        metadata: {
          ...data.metadata,
          validationError: errorMessage
        }
      };
    }
  }

  private async beforeRoleAdd(data: HookData<P>, context: PluginContext<P>): Promise<HookData<P> | void> {
    try {
      // Validar nome do role
      if (data.metadata?.roleName) {
        this.validateRole(data.metadata.roleName);
      }

      // Validar estrutura do role
      if (data.metadata?.roleDefinition) {
        this.validateRoleDefinition(data.metadata.roleDefinition);
      }

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      context.logger(`Erro de validação de role: ${errorMessage}`, 'error');
      
      if (this.config.strictMode) {
        throw error;
      }

      return {
        ...data,
        result: false,
        metadata: {
          ...data.metadata,
          validationError: errorMessage
        }
      };
    }
  }

  private async afterPermissionCheck(data: HookData<P>, context: PluginContext<P>): Promise<HookData<P> | void> {
    // Não há validação necessária após a verificação
    return data;
  }

  private async afterRoleUpdate(data: HookData<P>, context: PluginContext<P>): Promise<HookData<P> | void> {
    // Não há validação necessária após a atualização
    return data;
  }

  private async afterRoleAdd(data: HookData<P>, context: PluginContext<P>): Promise<HookData<P> | void> {
    // Não há validação necessária após a adição
    return data;
  }

  private async onError(data: HookData<P>, context: PluginContext<P>): Promise<HookData<P> | void> {
    // Log de erro de validação se houver
    if (data.metadata?.validationError) {
      context.logger(`Erro de validação capturado: ${data.metadata.validationError}`, 'error');
    }
    return data;
  }

  async onStartup(): Promise<void> {
    console.log('[VALIDATION] Plugin de validação iniciado');
  }

  async onShutdown(): Promise<void> {
    console.log('[VALIDATION] Plugin de validação finalizado');
  }

  // Métodos de validação públicos

  validateRole(role: string): void {
    if (!role || typeof role !== 'string') {
      throw new Error('Role deve ser uma string não vazia');
    }

    if (!this.rolePattern.test(role)) {
      throw new Error(`Role '${role}' deve conter apenas letras, números, hífens e underscores, e começar com letra`);
    }

    if (role.length > 50) {
      throw new Error(`Role '${role}' deve ter no máximo 50 caracteres`);
    }
  }

  validateOperation(operation: string | RegExp): void {
    if (typeof operation === 'string') {
      if (!operation || operation.trim() === '') {
        throw new Error('Operação deve ser uma string não vazia');
      }

      if (!this.operationPattern.test(operation)) {
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
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Regex inválida: ${errorMessage}`);
      }
    } else {
      throw new Error('Operação deve ser uma string ou RegExp');
    }
  }

  validateParams(params: P): void {
    if (params === null || params === undefined) {
      return;
    }

    if (typeof params !== 'object') {
      throw new Error('Parâmetros devem ser um objeto');
    }

    // Aplicar regras de validação customizadas
    for (const rule of this.validationRules) {
      const value = (params as any)[rule.field];
      
      if (rule.required && (value === undefined || value === null)) {
        throw new Error(`Campo '${rule.field}' é obrigatório`);
      }

      if (value !== undefined && value !== null && !rule.validator(value)) {
        throw new Error(rule.message);
      }
    }
  }

  validateRolesStructure(roles: any): void {
    if (!roles || typeof roles !== 'object') {
      throw new Error('Roles devem ser um objeto');
    }

    for (const [roleName, roleDef] of Object.entries(roles)) {
      this.validateRole(roleName);
      this.validateRoleDefinition(roleDef);
    }
  }

  validateRoleDefinition(roleDef: any): void {
    if (!roleDef || typeof roleDef !== 'object') {
      throw new Error('Definição de role deve ser um objeto');
    }

    if (!Array.isArray(roleDef.can)) {
      throw new Error('Propriedade "can" deve ser um array');
    }

    for (const permission of roleDef.can) {
      if (typeof permission === 'string') {
        this.validateOperation(permission);
      } else if (typeof permission === 'object' && permission.name) {
        this.validateOperation(permission.name);
        
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
        this.validateRole(inheritedRole);
      }
    }
  }

  // Métodos para configurar validações

  addValidationRule(rule: ValidationRule): void {
    this.validationRules.push(rule);
  }

  removeValidationRule(field: string): void {
    this.validationRules = this.validationRules.filter(rule => rule.field !== field);
  }

  addCustomValidator(name: string, validator: (value: any) => boolean): void {
    this.config.customValidators[name] = validator;
  }

  removeCustomValidator(name: string): void {
    delete this.config.customValidators[name];
  }

  // Validações específicas para diferentes tipos de dados

  addEmailValidation(field: string, required: boolean = false): void {
    this.addValidationRule({
      field,
      validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: `Campo '${field}' deve ser um email válido`,
      required
    });
  }

  addUrlValidation(field: string, required: boolean = false): void {
    this.addValidationRule({
      field,
      validator: (value) => {
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      message: `Campo '${field}' deve ser uma URL válida`,
      required
    });
  }

  addNumericValidation(field: string, min?: number, max?: number, required: boolean = false): void {
    this.addValidationRule({
      field,
      validator: (value) => {
        const num = Number(value);
        if (isNaN(num)) return false;
        if (min !== undefined && num < min) return false;
        if (max !== undefined && num > max) return false;
        return true;
      },
      message: `Campo '${field}' deve ser um número${min !== undefined ? ` >= ${min}` : ''}${max !== undefined ? ` <= ${max}` : ''}`,
      required
    });
  }

  addStringValidation(field: string, minLength?: number, maxLength?: number, required: boolean = false): void {
    this.addValidationRule({
      field,
      validator: (value) => {
        if (typeof value !== 'string') return false;
        if (minLength !== undefined && value.length < minLength) return false;
        if (maxLength !== undefined && value.length > maxLength) return false;
        return true;
      },
      message: `Campo '${field}' deve ser uma string${minLength !== undefined ? ` com pelo menos ${minLength} caracteres` : ''}${maxLength !== undefined ? ` e no máximo ${maxLength} caracteres` : ''}`,
      required
    });
  }

  // Métodos privados

  private setupDefaultRules(): void {
    // Regras padrão podem ser adicionadas aqui
  }

  // Métodos de estatísticas

  getValidationStats(): {
    totalRules: number;
    rulesByField: Record<string, number>;
    customValidators: string[];
  } {
    const rulesByField: Record<string, number> = {};
    
    for (const rule of this.validationRules) {
      rulesByField[rule.field] = (rulesByField[rule.field] || 0) + 1;
    }

    return {
      totalRules: this.validationRules.length,
      rulesByField,
      customValidators: Object.keys(this.config.customValidators)
    };
  }
}
