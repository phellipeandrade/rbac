import { EventEmitter } from 'events';
import { RBACPlugin, PluginContext, PluginConfig, PluginMetadata, HookData } from '../types';

interface AuditConfig {
  enableConsole: boolean;
  enableDatabase: boolean;
  enableFile: boolean;
  enableElasticsearch: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  retentionDays: number;
  batchSize: number;
  flushInterval: number;
}

interface AuditEvent {
  id: string;
  timestamp: Date;
  eventType: 'PERMISSION_CHECK' | 'ROLE_UPDATE' | 'ROLE_ADD' | 'ERROR' | 'PLUGIN_EVENT';
  userId?: string;
  role: string;
  operation: string;
  resource?: string;
  result: 'ALLOW' | 'DENY' | 'ERROR' | 'SUCCESS';
  reason?: string;
  metadata: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  tenantId?: string;
  executionTime?: number;
}

/**
 * Plugin de auditoria para rastrear todas as atividades do RBAC
 */
export class AuditPlugin<P = unknown> implements RBACPlugin<P> {
  metadata: PluginMetadata = {
    name: 'rbac-audit',
    version: '1.0.0',
    description: 'Audit plugin to track security activities and compliance',
    author: 'RBAC Team',
    license: 'MIT',
    keywords: ['audit', 'logging', 'compliance', 'security', 'tracking']
  };

  private config: AuditConfig = {
    enableConsole: true,
    enableDatabase: false,
    enableFile: false,
    enableElasticsearch: false,
    logLevel: 'info',
    retentionDays: 365,
    batchSize: 100,
    flushInterval: 5000
  };

  private eventQueue: AuditEvent[] = [];
  private isProcessing = false;
  private eventEmitter = new EventEmitter();
  private flushTimer?: NodeJS.Timeout;

  async install(context: PluginContext<P>): Promise<void> {
    context.logger('AuditPlugin installed', 'info');
    
    this.setupFlushTimer();
    this.setupEventHandlers(context);
  }

  async uninstall(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    // Process remaining events
    await this.flushEvents();
    
    this.eventEmitter.removeAllListeners();
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

  private async beforePermissionCheck(data: HookData<P>, context: PluginContext<P>): Promise<void> {
    // Mark start of verification to calculate execution time
    data.metadata = {
      ...data.metadata,
      auditStartTime: Date.now()
    };
  }

  private async afterPermissionCheck(data: HookData<P>, context: PluginContext<P>): Promise<void> {
    const executionTime = data.metadata?.auditStartTime 
      ? Date.now() - data.metadata.auditStartTime 
      : undefined;

    await this.logEvent({
      eventType: 'PERMISSION_CHECK',
      role: data.role,
      operation: String(data.operation),
      result: data.result ? 'ALLOW' : 'DENY',
      reason: data.metadata?.reason,
      metadata: {
        ...data.metadata,
        params: data.params,
        executionTime
      },
      executionTime
    });
  }

  private async beforeRoleUpdate(data: HookData<P>, context: PluginContext<P>): Promise<void> {
    await this.logEvent({
      eventType: 'ROLE_UPDATE',
      role: 'system',
      operation: 'update_roles',
      result: 'SUCCESS',
      metadata: {
        rolesUpdated: data.metadata?.roles ? Object.keys(data.metadata.roles) : [],
        timestamp: new Date().toISOString()
      }
    });
  }

  private async afterRoleUpdate(data: HookData<P>, context: PluginContext<P>): Promise<void> {
    // Event already logged in beforeRoleUpdate
  }

  private async beforeRoleAdd(data: HookData<P>, context: PluginContext<P>): Promise<void> {
    await this.logEvent({
      eventType: 'ROLE_ADD',
      role: 'system',
      operation: 'add_role',
      result: 'SUCCESS',
      metadata: {
        roleName: data.metadata?.roleName,
        roleDefinition: data.metadata?.roleDefinition,
        timestamp: new Date().toISOString()
      }
    });
  }

  private async afterRoleAdd(data: HookData<P>, context: PluginContext<P>): Promise<void> {
    // Event already logged in beforeRoleAdd
  }

  private async onError(data: HookData<P>, context: PluginContext<P>): Promise<void> {
    await this.logEvent({
      eventType: 'ERROR',
      role: data.role,
      operation: String(data.operation),
      result: 'ERROR',
      reason: data.error?.message,
      metadata: {
        error: data.error?.message,
        stack: data.error?.stack,
        params: data.params
      }
    });
  }

  async onStartup(): Promise<void> {
    // Initialize audit plugin resources
    console.log('[AUDIT] Audit plugin started');
  }

  async onShutdown(): Promise<void> {
    // Clean up resources and process pending events
    await this.flushEvents();
    console.log('[AUDIT] Audit plugin finished');
  }

  // Public methods for auditing

  async logEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    const auditEvent: AuditEvent = {
      id: this.generateId(),
      timestamp: new Date(),
      ...event
    };

    this.eventQueue.push(auditEvent);
    this.eventEmitter.emit('auditEvent', auditEvent);

    // Process immediately if queue is full
    if (this.eventQueue.length >= this.config.batchSize) {
      await this.flushEvents();
    }
  }

  async getLogs(filters: {
    eventType?: string;
    role?: string;
    operation?: string;
    result?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}): Promise<AuditEvent[]> {
    // Implementation would be done with database query
    // For simplicity, we return events from current queue
    let filteredEvents = this.eventQueue;

    if (filters.eventType) {
      filteredEvents = filteredEvents.filter(e => e.eventType === filters.eventType);
    }

    if (filters.role) {
      filteredEvents = filteredEvents.filter(e => e.role === filters.role);
    }

    if (filters.operation) {
      filteredEvents = filteredEvents.filter(e => e.operation === filters.operation);
    }

    if (filters.result) {
      filteredEvents = filteredEvents.filter(e => e.result === filters.result);
    }

    if (filters.startDate) {
      filteredEvents = filteredEvents.filter(e => e.timestamp >= filters.startDate!);
    }

    if (filters.endDate) {
      filteredEvents = filteredEvents.filter(e => e.timestamp <= filters.endDate!);
    }

    // Apply pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || 100;
    
    return filteredEvents.slice(offset, offset + limit);
  }

  async getStats(timeRange: { start: Date; end: Date }): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsByResult: Record<string, number>;
    topRoles: Array<{ role: string; count: number }>;
    topOperations: Array<{ operation: string; count: number }>;
    averageExecutionTime: number;
  }> {
    const events = await this.getLogs({
      startDate: timeRange.start,
      endDate: timeRange.end
    });

    const stats = {
      totalEvents: events.length,
      eventsByType: {} as Record<string, number>,
      eventsByResult: {} as Record<string, number>,
      topRoles: [] as Array<{ role: string; count: number }>,
      topOperations: [] as Array<{ operation: string; count: number }>,
      averageExecutionTime: 0
    };

    // Count by type
    for (const event of events) {
      stats.eventsByType[event.eventType] = (stats.eventsByType[event.eventType] || 0) + 1;
      stats.eventsByResult[event.result] = (stats.eventsByResult[event.result] || 0) + 1;
    }

    // Top roles
    const roleCounts: Record<string, number> = {};
    for (const event of events) {
      roleCounts[event.role] = (roleCounts[event.role] || 0) + 1;
    }
    stats.topRoles = Object.entries(roleCounts)
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top operations
    const operationCounts: Record<string, number> = {};
    for (const event of events) {
      operationCounts[event.operation] = (operationCounts[event.operation] || 0) + 1;
    }
    stats.topOperations = Object.entries(operationCounts)
      .map(([operation, count]) => ({ operation, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Average execution time
    const executionTimes = events
      .filter(e => e.executionTime !== undefined)
      .map(e => e.executionTime!);
    
    if (executionTimes.length > 0) {
      stats.averageExecutionTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
    }

    return stats;
  }

  // Private methods

  private setupFlushTimer(): void {
    this.flushTimer = setInterval(async () => {
      await this.flushEvents();
    }, this.config.flushInterval);
  }

  private setupEventHandlers(context: PluginContext<P>): void {
    // Listen to plugin events
    context.events.on('plugin.installed', (data) => {
      this.logEvent({
        eventType: 'PLUGIN_EVENT',
        role: 'system',
        operation: 'plugin_installed',
        result: 'SUCCESS',
        metadata: { plugin: data.plugin, version: data.data?.version }
      });
    });

    context.events.on('plugin.uninstalled', (data) => {
      this.logEvent({
        eventType: 'PLUGIN_EVENT',
        role: 'system',
        operation: 'plugin_uninstalled',
        result: 'SUCCESS',
        metadata: { plugin: data.plugin }
      });
    });

    context.events.on('plugin.error', (data) => {
      this.logEvent({
        eventType: 'ERROR',
        role: 'system',
        operation: 'plugin_error',
        result: 'ERROR',
        reason: data.data?.error,
        metadata: { plugin: data.plugin, error: data.data?.error }
      });
    });
  }

  private async flushEvents(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const events = this.eventQueue.splice(0, this.config.batchSize);
      
      // Send to different destinations
      if (this.config.enableConsole) {
        await this.sendToConsole(events);
      }

      if (this.config.enableDatabase) {
        await this.sendToDatabase(events);
      }

      if (this.config.enableFile) {
        await this.sendToFile(events);
      }

      if (this.config.enableElasticsearch) {
        await this.sendToElasticsearch(events);
      }

    } catch (error) {
      console.error('Error processing audit events:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async sendToConsole(events: AuditEvent[]): Promise<void> {
    for (const event of events) {
      console.log(`[AUDIT] ${event.timestamp.toISOString()} - ${event.eventType} - ${event.role} - ${event.operation} - ${event.result}`);
    }
  }

  private async sendToDatabase(events: AuditEvent[]): Promise<void> {
    // Implementation would be done with specific database driver
    console.log(`[DATABASE] Sending ${events.length} audit events`);
  }

  private async sendToFile(events: AuditEvent[]): Promise<void> {
    // Implementation would be done with fs
    console.log(`[FILE] Sending ${events.length} audit events`);
  }

  private async sendToElasticsearch(events: AuditEvent[]): Promise<void> {
    // Implementation would be done with @elastic/elasticsearch
    console.log(`[ELASTICSEARCH] Sending ${events.length} audit events`);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Statistics methods

  getQueueStats(): {
    queueSize: number;
    isProcessing: boolean;
    config: AuditConfig;
  } {
    return {
      queueSize: this.eventQueue.length,
      isProcessing: this.isProcessing,
      config: this.config
    };
  }
}
