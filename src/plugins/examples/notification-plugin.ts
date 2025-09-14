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
    context.logger('NotificationPlugin instalado', 'info');
    
    // Configurar processamento de notificações
    this.setupNotificationProcessing();
    
    // Registrar listeners para eventos do sistema
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
      afterPermissionCheck: this.afterPermissionCheck.bind(this),
      onError: this.onError.bind(this)
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

  private async onError(data: HookData<P>, context: PluginContext<P>): Promise<void> {
    this.notify('rbac.error', {
      error: data.error?.message,
      role: data.role,
      operation: data.operation,
      stack: data.error?.stack
    }, 'critical');
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

    // Processar imediatamente se habilitado
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

  // Configuração de canais

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
      events: ['*'] // Todos os eventos
    });
  }

  // Métodos privados

  private setupNotificationProcessing(): void {
    // Processar notificações em lote a cada 5 segundos
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
      const notifications = this.notificationQueue.splice(0, 100); // Processar até 100 por vez

      for (const notification of notifications) {
        await this.sendNotification(notification);
      }
    } catch (error) {
      console.error('Erro ao processar notificações:', error);
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
          console.error(`Erro ao enviar notificação para canal ${channel.type}:`, error);
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
    // Implementação seria feita com nodemailer ou similar
    console.log(`[EMAIL] ${notification.type}: ${JSON.stringify(notification.data)}`);
  }

  private async sendWebhook(notification: NotificationEvent, config: any): Promise<void> {
    // Implementação seria feita com fetch ou axios
    console.log(`[WEBHOOK] ${notification.type}: ${JSON.stringify(notification.data)}`);
  }

  private async sendSlack(notification: NotificationEvent, config: any): Promise<void> {
    // Implementação seria feita com @slack/web-api
    console.log(`[SLACK] ${notification.type}: ${JSON.stringify(notification.data)}`);
  }

  private async sendToDatabase(notification: NotificationEvent, config: any): Promise<void> {
    // Implementação seria feita com o driver do banco específico
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
    // Implementar lógica para detectar atividade suspeita
    // Exemplo: muitas tentativas de acesso negado em pouco tempo
    return false; // Placeholder
  }

  // Métodos de estatísticas

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

    // Implementar contagem de estatísticas
    return stats;
  }
}
