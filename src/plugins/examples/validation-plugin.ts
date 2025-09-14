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
    context.logger('ValidationPlugin installed', 'info');
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
      // Validate role
      if (this.config.validateRoles) {
        this.validateRole(data.role);
      }

      // Validate operation
      if (this.config.validateOperations) {
        this.validateOperation(data.operation);
      }

      // Validate parameters
      if (this.config.validateParams && data.params) {
        this.validateParams(data.params);
      }

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      context.logger(`Validation error: ${errorMessage}`, 'error');
      
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
      // Validate roles structure
      if (data.metadata?.roles) {
        this.validateRolesStructure(data.metadata.roles);
      }

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      context.logger(`Roles validation error: ${errorMessage}`, 'error');
      
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
      // Validate role name
      if (data.metadata?.roleName) {
        this.validateRole(data.metadata.roleName);
      }

      // Validate role structure
      if (data.metadata?.roleDefinition) {
        this.validateRoleDefinition(data.metadata.roleDefinition);
      }

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      context.logger(`Role validation error: ${errorMessage}`, 'error');
      
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
    // No validation needed after verification
    return data;
  }

  private async afterRoleUpdate(data: HookData<P>, context: PluginContext<P>): Promise<HookData<P> | void> {
    // No validation needed after update
    return data;
  }

  private async afterRoleAdd(data: HookData<P>, context: PluginContext<P>): Promise<HookData<P> | void> {
    // No validation needed after addition
    return data;
  }

  private async onError(data: HookData<P>, context: PluginContext<P>): Promise<HookData<P> | void> {
    // Log validation error if any
    if (data.metadata?.validationError) {
      context.logger(`Validation error captured: ${data.metadata.validationError}`, 'error');
    }
    return data;
  }

  async onStartup(): Promise<void> {
    console.log('[VALIDATION] Validation plugin started');
  }

  async onShutdown(): Promise<void> {
    console.log('[VALIDATION] Validation plugin finished');
  }

  // Public validation methods

  validateRole(role: string): void {
    if (!role || typeof role !== 'string') {
      throw new Error('Role must be a non-empty string');
    }

    if (!this.rolePattern.test(role)) {
      throw new Error(`Role '${role}' must contain only letters, numbers, hyphens and underscores, and start with a letter`);
    }

    if (role.length > 50) {
      throw new Error(`Role '${role}' must have at most 50 characters`);
    }
  }

  validateOperation(operation: string | RegExp): void {
    if (typeof operation === 'string') {
      if (!operation || operation.trim() === '') {
        throw new Error('Operation must be a non-empty string');
      }

      if (!this.operationPattern.test(operation)) {
        throw new Error(`Operation '${operation}' must contain only letters, numbers, colons, dots and hyphens, and start with a letter`);
      }

      if (operation.length > 100) {
        throw new Error(`Operation '${operation}' must have at most 100 characters`);
      }
    } else if (operation instanceof RegExp) {
      // Validate regex
      try {
        new RegExp(operation.source, operation.flags);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Invalid regex: ${errorMessage}`);
      }
    } else {
      throw new Error('Operation must be a string or RegExp');
    }
  }

  validateParams(params: P): void {
    if (params === null || params === undefined) {
      return;
    }

    if (typeof params !== 'object') {
      throw new Error('Parameters must be an object');
    }

    // Apply custom validation rules
    for (const rule of this.validationRules) {
      const value = (params as any)[rule.field];
      
      if (rule.required && (value === undefined || value === null)) {
        throw new Error(`Field '${rule.field}' is required`);
      }

      if (value !== undefined && value !== null && !rule.validator(value)) {
        throw new Error(rule.message);
      }
    }
  }

  validateRolesStructure(roles: any): void {
    if (!roles || typeof roles !== 'object') {
      throw new Error('Roles must be an object');
    }

    for (const [roleName, roleDef] of Object.entries(roles)) {
      this.validateRole(roleName);
      this.validateRoleDefinition(roleDef);
    }
  }

  validateRoleDefinition(roleDef: any): void {
    if (!roleDef || typeof roleDef !== 'object') {
      throw new Error('Role definition must be an object');
    }

    if (!Array.isArray(roleDef.can)) {
      throw new Error('Property "can" must be an array');
    }

    for (const permission of roleDef.can) {
      if (typeof permission === 'string') {
        this.validateOperation(permission);
      } else if (typeof permission === 'object' && permission.name) {
        this.validateOperation(permission.name);
        
        if (permission.when && typeof permission.when !== 'function') {
          throw new Error('Property "when" must be a function');
        }
      } else {
        throw new Error('Permission must be a string or object with "name" property');
      }
    }

    if (roleDef.inherits) {
      if (!Array.isArray(roleDef.inherits)) {
        throw new Error('Property "inherits" must be an array');
      }

      for (const inheritedRole of roleDef.inherits) {
        this.validateRole(inheritedRole);
      }
    }
  }

  // Methods to configure validations

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

  // Specific validations for different data types

  addEmailValidation(field: string, required: boolean = false): void {
    this.addValidationRule({
      field,
      validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: `Field '${field}' must be a valid email`,
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
      message: `Field '${field}' must be a valid URL`,
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
      message: `Field '${field}' must be a number${min !== undefined ? ` >= ${min}` : ''}${max !== undefined ? ` <= ${max}` : ''}`,
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
      message: `Field '${field}' must be a string${minLength !== undefined ? ` with at least ${minLength} characters` : ''}${maxLength !== undefined ? ` and at most ${maxLength} characters` : ''}`,
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
