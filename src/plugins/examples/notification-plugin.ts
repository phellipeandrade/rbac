import { EventEmitter } from 'events';
import { RBACPlugin, PluginContext, PluginConfig, PluginMetadata, HookData } from '../types';

interface NotificationConfig {
  channels: NotificationChannel[];
  enableRealTime: boolean;
  enableEmail: boolean;
  enableWebhook: boolean;
  enableSlack: boolean;
}

interface NotificationChannel {
  type: 'email' | 'webhook' | 'slack' | 'console' | 'database';
  config: any;
  events: string[];
}

interface NotificationEvent {
  type: string;
  timestamp: Date;
  data: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Plugin de notificações para eventos do RBAC
 */
export class NotificationPlugin<P = unknown> implements RBACPlugin<P> {
  metadata: PluginMetadata = {
    name: 'rbac-notifications',
    version: '1.0.0',
    description: 'Plugin de notificações para eventos de segurança e auditoria',
    author: 'RBAC Team',
    license: 'MIT',
    keywords: ['notifications', 'alerts', 'security', 'audit']
  };

  private config: NotificationConfig = {
    channels: [],
    enableRealTime: true,
    enableEmail: false,
    enableWebhook: false,
    enableSlack: false
  };

  private eventEmitter = new EventEmitter();
  private notificationQueue: NotificationEvent[] = [];
  private isProcessing = false;

  async install(context: PluginContext<P>): Promise<void> {
    context.logger('NotificationPlugin installed', 'info');
    
    // Configure notification processing
    this.setupNotificationProcessing();
    
    // Register listeners for system events
    context.events.on('plugin.installed', (data) => {
      this.notify('plugin.installed', data, 'medium');
    });

    context.events.on('plugin.uninstalled', (data) => {
      this.notify('plugin.uninstalled', data, 'medium');
    });

    context.events.on('plugin.error', (data) => {
      this.notify('plugin.error', data, 'high');
    });
  }

  async uninstall(): Promise<void> {
    this.eventEmitter.removeAllListeners();
    this.notificationQueue = [];
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

  private async afterPermissionCheck(data: HookData<P>, context: PluginContext<P>): Promise<void> {
    // Notificar sobre verificações de permissão negadas
    if (data.result === false) {
      this.notify('permission.denied', {
        role: data.role,
        operation: data.operation,
        params: data.params,
        reason: data.metadata?.reason
      }, 'medium');
    }

    // Notificar sobre verificações suspeitas
    if (this.isSuspiciousActivity(data)) {
      this.notify('suspicious.activity', {
        role: data.role,
        operation: data.operation,
        params: data.params,
        metadata: data.metadata
      }, 'high');
    }
  }

  private async beforePermissionCheck(data: HookData<P>, context: PluginContext<P>): Promise<void> {
    // No notification needed before verification
  }

  private async beforeRoleUpdate(data: HookData<P>, context: PluginContext<P>): Promise<void> {
    this.notify('role.update.started', {
      role: data.role,
      metadata: data.metadata
    }, 'low');
  }

  private async afterRoleUpdate(data: HookData<P>, context: PluginContext<P>): Promise<void> {
    this.notify('role.update.completed', {
      role: data.role,
      metadata: data.metadata
    }, 'low');
  }

  private async beforeRoleAdd(data: HookData<P>, context: PluginContext<P>): Promise<void> {
    this.notify('role.add.started', {
      role: data.role,
      metadata: data.metadata
    }, 'low');
  }

  private async afterRoleAdd(data: HookData<P>, context: PluginContext<P>): Promise<void> {
    this.notify('role.add.completed', {
      role: data.role,
      metadata: data.metadata
    }, 'low');
  }

  private async onError(data: HookData<P>, context: PluginContext<P>): Promise<void> {
    this.notify('rbac.error', {
      error: data.error?.message,
      role: data.role,
      operation: data.operation,
      stack: data.error?.stack
    }, 'critical');
  }

  async onStartup(): Promise<void> {
    console.log('[NOTIFICATION] Notification plugin started');
  }

  async onShutdown(): Promise<void> {
    // Process pending notifications before finishing
    await this.processNotifications();
    console.log('[NOTIFICATION] Notification plugin finished');
  }

  // Métodos públicos para notificações

  async notify(type: string, data: any, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'): Promise<void> {
    const notification: NotificationEvent = {
      type,
      timestamp: new Date(),
      data,
      severity
    };

    this.notificationQueue.push(notification);
    this.eventEmitter.emit('notification', notification);

    // Process immediately if enabled
    if (this.config.enableRealTime) {
      this.processNotifications();
    }
  }

  subscribe(event: string, handler: (data: any) => void): void {
    this.eventEmitter.on(event, handler);
  }

  unsubscribe(event: string, handler: (data: any) => void): void {
    this.eventEmitter.off(event, handler);
  }

  // Channel configuration

  addEmailChannel(config: { smtp: any; from: string; to: string[] }): void {
    this.config.channels.push({
      type: 'email',
      config,
      events: ['permission.denied', 'suspicious.activity', 'rbac.error']
    });
  }

  addWebhookChannel(config: { url: string; headers?: Record<string, string> }): void {
    this.config.channels.push({
      type: 'webhook',
      config,
      events: ['permission.denied', 'suspicious.activity', 'rbac.error']
    });
  }

  addSlackChannel(config: { webhookUrl: string; channel: string }): void {
    this.config.channels.push({
      type: 'slack',
      config,
      events: ['permission.denied', 'suspicious.activity', 'rbac.error']
    });
  }

  addDatabaseChannel(config: { table: string; connection: any }): void {
    this.config.channels.push({
      type: 'database',
      config,
      events: ['*'] // All events
    });
  }

  // Private methods

  private setupNotificationProcessing(): void {
    // Process notifications in batch every 5 seconds
    setInterval(() => {
      this.processNotifications();
    }, 5000);
  }

  private async processNotifications(): Promise<void> {
    if (this.isProcessing || this.notificationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const notifications = this.notificationQueue.splice(0, 100); // Process up to 100 at a time

      for (const notification of notifications) {
        await this.sendNotification(notification);
      }
    } catch (error) {
      console.error('Error processing notifications:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async sendNotification(notification: NotificationEvent): Promise<void> {
    for (const channel of this.config.channels) {
      if (this.shouldSendToChannel(notification, channel)) {
        try {
          await this.sendToChannel(notification, channel);
        } catch (error) {
          console.error(`Error sending notification to channel ${channel.type}:`, error);
        }
      }
    }
  }

  private shouldSendToChannel(notification: NotificationEvent, channel: NotificationChannel): boolean {
    return channel.events.includes('*') || channel.events.includes(notification.type);
  }

  private async sendToChannel(notification: NotificationEvent, channel: NotificationChannel): Promise<void> {
    switch (channel.type) {
      case 'email':
        await this.sendEmail(notification, channel.config);
        break;
      case 'webhook':
        await this.sendWebhook(notification, channel.config);
        break;
      case 'slack':
        await this.sendSlack(notification, channel.config);
        break;
      case 'database':
        await this.sendToDatabase(notification, channel.config);
        break;
      case 'console':
        this.sendToConsole(notification);
        break;
    }
  }

  private async sendEmail(notification: NotificationEvent, config: any): Promise<void> {
    // Implementation would be done with nodemailer or similar
    console.log(`[EMAIL] ${notification.type}: ${JSON.stringify(notification.data)}`);
  }

  private async sendWebhook(notification: NotificationEvent, config: any): Promise<void> {
    // Implementation would be done with fetch or axios
    console.log(`[WEBHOOK] ${notification.type}: ${JSON.stringify(notification.data)}`);
  }

  private async sendSlack(notification: NotificationEvent, config: any): Promise<void> {
    // Implementation would be done with @slack/web-api
    console.log(`[SLACK] ${notification.type}: ${JSON.stringify(notification.data)}`);
  }

  private async sendToDatabase(notification: NotificationEvent, config: any): Promise<void> {
    // Implementation would be done with specific database driver
    console.log(`[DATABASE] ${notification.type}: ${JSON.stringify(notification.data)}`);
  }

  private sendToConsole(notification: NotificationEvent): void {
    const emoji = this.getSeverityEmoji(notification.severity);
    console.log(`${emoji} [${notification.severity.toUpperCase()}] ${notification.type}: ${JSON.stringify(notification.data)}`);
  }

  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'low': return 'ℹ️';
      case 'medium': return '⚠️';
      case 'high': return '🚨';
      case 'critical': return '💥';
      default: return '📢';
    }
  }

  private isSuspiciousActivity(data: HookData<P>): boolean {
    // Implement logic to detect suspicious activity
    // Example: many denied access attempts in a short time
    return false; // Placeholder
  }

  // Statistics methods

  getStats(): {
    totalNotifications: number;
    notificationsByType: Record<string, number>;
    notificationsBySeverity: Record<string, number>;
    queueSize: number;
  } {
    const stats = {
      totalNotifications: 0,
      notificationsByType: {} as Record<string, number>,
      notificationsBySeverity: {} as Record<string, number>,
      queueSize: this.notificationQueue.length
    };

    // Implement statistics counting
    return stats;
  }
}
