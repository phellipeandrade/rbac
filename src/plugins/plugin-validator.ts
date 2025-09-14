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
  // Validate basic plugin structure
  static validateCommunityPlugin(plugin: Plugin): ValidationResult {
    const errors: string[] = [];

    // Validate required metadata
    if (!plugin.metadata) {
      errors.push('Plugin must have metadata');
    } else {
      if (!plugin.metadata.name) {
        errors.push('Plugin must have a name');
      }

      if (!plugin.metadata.version) {
        errors.push('Plugin must have a version');
      }

      if (!plugin.metadata.description) {
        errors.push('Plugin must have a description');
      }

      if (!plugin.metadata.author) {
        errors.push('Plugin must have an author');
      }

      if (!plugin.metadata.license) {
        errors.push('Plugin must have a license');
      }

      // Validate version format
      if (plugin.metadata.version && !this.isValidVersion(plugin.metadata.version)) {
        errors.push('Version must follow semver format (ex: 1.0.0)');
      }

      // Validate plugin name
      if (plugin.metadata.name && !this.isValidPluginName(plugin.metadata.name)) {
        errors.push('Plugin name must contain only letters, numbers, hyphens and underscores');
      }
    }

    // Validate required functions
    if (typeof plugin.install !== 'function') {
      errors.push('Plugin must implement install function');
    }

    if (typeof plugin.uninstall !== 'function') {
      errors.push('Plugin must implement uninstall function');
    }

    // Validate hooks
    if (plugin.getHooks && typeof plugin.getHooks !== 'function') {
      errors.push('getHooks must be a function');
    }

    // Validate configure
    if (plugin.configure && typeof plugin.configure !== 'function') {
      errors.push('configure must be a function');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Validate plugin security
  static validatePluginSecurity(plugin: Plugin): SecurityResult {
    const warnings: string[] = [];

    // Convert plugin to string representation that includes function bodies
    const pluginString = this.pluginToString(plugin);
    
    // Check for eval or Function usage
    if (pluginString.includes('eval(') || pluginString.includes('Function(')) {
      warnings.push('Plugin contains potentially unsafe code (eval/Function)');
    }

    // Check for unverified module requires
    if (pluginString.includes('require(') && !pluginString.includes('@rbac/')) {
      warnings.push('Plugin may have unverified dependencies');
    }

    // Check for process.env usage without validation
    if (pluginString.includes('process.env') && !pluginString.includes('NODE_ENV')) {
      warnings.push('Plugin accesses environment variables without validation');
    }

    // Check for console.log usage in production
    if (pluginString.includes('console.log') || pluginString.includes('console.warn')) {
      warnings.push('Plugin uses console.log/warn which may leak information in production');
    }

    // Check for setTimeout/setInterval usage
    if (pluginString.includes('setTimeout') || pluginString.includes('setInterval')) {
      warnings.push('Plugin uses timers that may cause memory leaks');
    }

    return {
      safe: warnings.length === 0,
      warnings
    };
  }

  // Helper method to convert plugin to string representation
  private static pluginToString(plugin: Plugin): string {
    let result = '';
    
    // Convert metadata
    if (plugin.metadata) {
      result += JSON.stringify(plugin.metadata);
    }
    
    // Convert functions to string
    if (plugin.install) {
      result += plugin.install.toString();
    }
    if (plugin.uninstall) {
      result += plugin.uninstall.toString();
    }
    if (plugin.configure) {
      result += plugin.configure.toString();
    }
    if (plugin.getHooks) {
      result += plugin.getHooks.toString();
    }
    
    return result;
  }

  // Validate version compatibility
  static validateVersionCompatibility(plugin: Plugin, rbacVersion: string): ValidationResult {
    const errors: string[] = [];

    // Check if plugin specifies compatibility
    if (plugin.metadata && (plugin.metadata as any).peerDependencies) {
      const rbacDep = (plugin.metadata as any).peerDependencies['@rbac/rbac'];
      if (rbacDep && !this.isVersionCompatible(rbacVersion, rbacDep)) {
        errors.push(`Plugin requires @rbac/rbac ${rbacDep} but found ${rbacVersion}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Validate plugin configuration
  static validatePluginConfig(config: any): ValidationResult {
    const errors: string[] = [];

    if (typeof config !== 'object' || config === null) {
      errors.push('Configuration must be an object');
      return { valid: false, errors };
    }

    if (typeof config.enabled !== 'boolean') {
      errors.push('Configuration must have enabled field (boolean)');
    }

    if (typeof config.priority !== 'number' || config.priority < 0 || config.priority > 100) {
      errors.push('Configuration must have priority field (number between 0 and 100)');
    }

    if (typeof config.settings !== 'object' || config.settings === null) {
      errors.push('Configuration must have settings field (object)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Validate plugin hooks
  static validatePluginHooks(hooks: any): ValidationResult {
    const errors: string[] = [];

    if (typeof hooks !== 'object' || hooks === null) {
      errors.push('Hooks must be an object');
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
        errors.push(`Invalid hook type: ${hookType}`);
      }

      if (typeof handler !== 'function') {
        errors.push(`Hook ${hookType} must be a function`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Helper functions
  private static isValidVersion(version: string): boolean {
    const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
    return semverRegex.test(version);
  }

  private static isValidPluginName(name: string): boolean {
    const nameRegex = /^[a-zA-Z0-9-_]+$/;
    return nameRegex.test(name);
  }

  private static isVersionCompatible(version: string, requirement: string): boolean {
    // Simple compatibility check implementation
    // In production, use a library like semver
    const versionParts = version.split('.').map(Number);
    const reqParts = requirement.replace(/[^0-9.]/g, '').split('.').map(Number);
    
    if (reqParts.length !== 3) return false;
    
    return versionParts[0] >= reqParts[0] && 
           versionParts[1] >= reqParts[1] && 
           versionParts[2] >= reqParts[2];
  }
}
