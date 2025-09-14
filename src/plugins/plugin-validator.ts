import { Plugin } from './functional-types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface SecurityResult {
  safe: boolean;
  warnings: string[];
}

export class PluginValidator {
  // Validar estrutura básica do plugin
  static validateCommunityPlugin(plugin: Plugin): ValidationResult {
    const errors: string[] = [];

    // Validar metadata obrigatória
    if (!plugin.metadata) {
      errors.push('Plugin deve ter metadata');
    } else {
      if (!plugin.metadata.name) {
        errors.push('Plugin deve ter um nome');
      }

      if (!plugin.metadata.version) {
        errors.push('Plugin deve ter uma versão');
      }

      if (!plugin.metadata.description) {
        errors.push('Plugin deve ter uma descrição');
      }

      if (!plugin.metadata.author) {
        errors.push('Plugin deve ter um autor');
      }

      if (!plugin.metadata.license) {
        errors.push('Plugin deve ter uma licença');
      }

      // Validar formato da versão
      if (plugin.metadata.version && !this.isValidVersion(plugin.metadata.version)) {
        errors.push('Versão deve seguir o formato semver (ex: 1.0.0)');
      }

      // Validar nome do plugin
      if (plugin.metadata.name && !this.isValidPluginName(plugin.metadata.name)) {
        errors.push('Nome do plugin deve conter apenas letras, números, hífens e underscores');
      }
    }

    // Validar funções obrigatórias
    if (typeof plugin.install !== 'function') {
      errors.push('Plugin deve implementar a função install');
    }

    if (typeof plugin.uninstall !== 'function') {
      errors.push('Plugin deve implementar a função uninstall');
    }

    // Validar hooks
    if (plugin.getHooks && typeof plugin.getHooks !== 'function') {
      errors.push('getHooks deve ser uma função');
    }

    // Validar configure
    if (plugin.configure && typeof plugin.configure !== 'function') {
      errors.push('configure deve ser uma função');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Validar segurança do plugin
  static validatePluginSecurity(plugin: Plugin): SecurityResult {
    const warnings: string[] = [];

    // Verificar se não há código suspeito
    const pluginString = JSON.stringify(plugin);
    
    // Verificar uso de eval ou Function
    if (pluginString.includes('eval(') || pluginString.includes('Function(')) {
      warnings.push('Plugin contém código potencialmente inseguro (eval/Function)');
    }

    // Verificar require de módulos não verificados
    if (pluginString.includes('require(') && !pluginString.includes('@rbac/')) {
      warnings.push('Plugin pode ter dependências não verificadas');
    }

    // Verificar uso de process.env sem validação
    if (pluginString.includes('process.env') && !pluginString.includes('NODE_ENV')) {
      warnings.push('Plugin acessa variáveis de ambiente sem validação');
    }

    // Verificar uso de console.log em produção
    if (pluginString.includes('console.log') || pluginString.includes('console.warn')) {
      warnings.push('Plugin usa console.log/warn que pode vazar informações em produção');
    }

    // Verificar uso de setTimeout/setInterval
    if (pluginString.includes('setTimeout') || pluginString.includes('setInterval')) {
      warnings.push('Plugin usa timers que podem causar vazamentos de memória');
    }

    return {
      safe: warnings.length === 0,
      warnings
    };
  }

  // Validar compatibilidade de versão
  static validateVersionCompatibility(plugin: Plugin, rbacVersion: string): ValidationResult {
    const errors: string[] = [];

    // Verificar se o plugin especifica compatibilidade
    if (plugin.metadata && plugin.metadata.peerDependencies) {
      const rbacDep = plugin.metadata.peerDependencies['@rbac/rbac'];
      if (rbacDep && !this.isVersionCompatible(rbacVersion, rbacDep)) {
        errors.push(`Plugin requer @rbac/rbac ${rbacDep} mas encontrado ${rbacVersion}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Validar configuração do plugin
  static validatePluginConfig(config: any): ValidationResult {
    const errors: string[] = [];

    if (typeof config !== 'object' || config === null) {
      errors.push('Configuração deve ser um objeto');
      return { valid: false, errors };
    }

    if (typeof config.enabled !== 'boolean') {
      errors.push('Configuração deve ter campo enabled (boolean)');
    }

    if (typeof config.priority !== 'number' || config.priority < 0 || config.priority > 100) {
      errors.push('Configuração deve ter campo priority (number entre 0 e 100)');
    }

    if (typeof config.settings !== 'object' || config.settings === null) {
      errors.push('Configuração deve ter campo settings (object)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Validar hooks do plugin
  static validatePluginHooks(hooks: any): ValidationResult {
    const errors: string[] = [];

    if (typeof hooks !== 'object' || hooks === null) {
      errors.push('Hooks devem ser um objeto');
      return { valid: false, errors };
    }

    const validHookTypes = [
      'beforePermissionCheck',
      'afterPermissionCheck',
      'beforeRoleUpdate',
      'afterRoleUpdate',
      'beforeRoleAdd',
      'afterRoleAdd',
      'onError'
    ];

    for (const [hookType, handler] of Object.entries(hooks)) {
      if (!validHookTypes.includes(hookType)) {
        errors.push(`Tipo de hook inválido: ${hookType}`);
      }

      if (typeof handler !== 'function') {
        errors.push(`Hook ${hookType} deve ser uma função`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Funções auxiliares
  private static isValidVersion(version: string): boolean {
    const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
    return semverRegex.test(version);
  }

  private static isValidPluginName(name: string): boolean {
    const nameRegex = /^[a-zA-Z0-9-_]+$/;
    return nameRegex.test(name);
  }

  private static isVersionCompatible(version: string, requirement: string): boolean {
    // Implementação simples de verificação de compatibilidade
    // Em produção, usar uma biblioteca como semver
    const versionParts = version.split('.').map(Number);
    const reqParts = requirement.replace(/[^0-9.]/g, '').split('.').map(Number);
    
    if (reqParts.length !== 3) return false;
    
    return versionParts[0] >= reqParts[0] && 
           versionParts[1] >= reqParts[1] && 
           versionParts[2] >= reqParts[2];
  }
}
