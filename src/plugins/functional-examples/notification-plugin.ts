import { Plugin, PluginConfig, PluginContext, HookData, HookType } from '../functional-types';

// Estado das notificações
interface NotificationState {
  config: {
    channels: Array<{
      type: 'email' | 'webhook' | 'slack' | 'console' | 'database';
      config: any;
      events: string[];
    }>;
    enableRealTime: boolean;
    batchSize: number;
    flushInterval: number;
  };
  queue: Array<{
    type: string;
    timestamp: Date;
    data: any;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  isProcessing: boolean;
  stats: {
    totalSent: number;
    errors: number;
  };
}

// Criar estado inicial das notificações
const createNotificationState = (config: any): NotificationState => ({
  config: {
    channels: [],
    enableRealTime: true,
    batchSize: 100,
    flushInterval: 5000,
    ...config
  },
  queue: [],
  isProcessing: false,
  stats: {
    totalSent: 0,
    errors: 0
  }
});

// Plugin de notificações funcional
export const createNotificationPlugin = (config: PluginConfig = { enabled: true, priority: 50, settings: {} }): Plugin => {
  let state: NotificationState | null = null;
  let flushTimer: any = null;

  return {
    metadata: {
      name: 'rbac-notification',
      version: '1.0.0',
      description: 'Notification plugin for security and audit events',
      author: 'RBAC Team',
      license: 'MIT',
      keywords: ['notifications', 'alerts', 'security', 'audit']
    },

    install: async (context: PluginContext) => {
      state = createNotificationState(config.settings);
      context.logger('NotificationPlugin installed', 'info');
      
      // Configurar processamento de notificações
      setupNotificationProcessing(state, context);
      
      // Registrar listeners para eventos do sistema
      context.events.on('plugin.installed', (data) => {
        notify(state!, 'plugin.installed', data, 'medium');
      });

      context.events.on('plugin.uninstalled', (data) => {
        notify(state!, 'plugin.uninstalled', data, 'medium');
      });

      context.events.on('plugin.error', (data) => {
        notify(state!, 'plugin.error', data, 'high');
      });
    },

    uninstall: () => {
      if (flushTimer) {
        clearInterval(flushTimer);
        flushTimer = null;
      }
      
      if (state) {
      // Processar eventos restantes
      processNotifications(state, { 
        logger: () => {}, 
        rbac: {} as any, 
        events: {} as any 
      } as PluginContext);
        state = null;
      }
    },

    configure: (newConfig: PluginConfig) => {
      if (state && newConfig.settings) {
        state.config = { ...state.config, ...newConfig.settings };
      }
    },

    getHooks: () => ({
      beforePermissionCheck: async (data: HookData, context: PluginContext) => data,
      afterPermissionCheck: async (data: HookData, context: PluginContext) => {
        if (!state) return data;

        // Notificar sobre verificações de permissão negadas
        if (data.result === false) {
          notify(state, 'permission.denied', {
            role: data.role,
            operation: data.operation,
            params: data.params,
            reason: data.metadata?.reason
          }, 'medium');
        }

        // Notificar sobre verificações suspeitas
        if (isSuspiciousActivity(data)) {
          notify(state, 'suspicious.activity', {
            role: data.role,
            operation: data.operation,
            params: data.params,
            metadata: data.metadata
          }, 'high');
        }

        return data;
      },
      beforeRoleUpdate: async (data: HookData, context: PluginContext) => data,
      afterRoleUpdate: async (data: HookData, context: PluginContext) => data,
      beforeRoleAdd: async (data: HookData, context: PluginContext) => data,
      afterRoleAdd: async (data: HookData, context: PluginContext) => data,
      onError: async (data: HookData, context: PluginContext) => {
        if (!state) return data;

        notify(state, 'rbac.error', {
          error: data.error?.message,
          role: data.role,
          operation: data.operation,
          stack: data.error?.stack
        }, 'critical');

        return data;
      }
    })
  };
};

// Funções auxiliares das notificações

const setupNotificationProcessing = (state: NotificationState, context: PluginContext): void => {
  // Processar notificações em lote a cada 5 segundos
  setInterval(() => {
    processNotifications(state, context);
  }, state.config.flushInterval);
};

const notify = async (
  state: NotificationState,
  type: string,
  data: any,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): Promise<void> => {
  const notification = {
    type,
    timestamp: new Date(),
    data,
    severity
  };

  state.queue.push(notification);

  // Processar imediatamente se habilitado
  if (state.config.enableRealTime) {
    await processNotifications(state, { logger: () => {} });
  }
};

const processNotifications = async (state: NotificationState, context: { logger: (msg: string, level?: 'info' | 'warn' | 'error') => void }): Promise<void> => {
  if (state.isProcessing || state.queue.length === 0) {
    return;
  }

  state.isProcessing = true;

  try {
    const notifications = state.queue.splice(0, state.config.batchSize);

    for (const notification of notifications) {
      await sendNotification(notification, state, context);
    }
  } catch (error) {
    state.stats.errors++;
    context.logger('Erro ao processar notificações:', 'error');
  } finally {
    state.isProcessing = false;
  }
};

const sendNotification = async (
  notification: any, 
  state: NotificationState, 
  context: { logger: (msg: string, level?: 'info' | 'warn' | 'error') => void }
): Promise<void> => {
  for (const channel of state.config.channels) {
    if (shouldSendToChannel(notification, channel)) {
      try {
        await sendToChannel(notification, channel, context);
        state.stats.totalSent++;
      } catch (error) {
        state.stats.errors++;
        context.logger(`Erro ao enviar notificação para canal ${channel.type}:`, 'error');
      }
    }
  }
};

const shouldSendToChannel = (notification: any, channel: any): boolean => {
  return channel.events.includes('*') || channel.events.includes(notification.type);
};

const sendToChannel = async (notification: any, channel: any, context: { logger: (msg: string, level?: 'info' | 'warn' | 'error') => void }): Promise<void> => {
  switch (channel.type) {
    case 'email':
      await sendEmail(notification, channel.config, context);
      break;
    case 'webhook':
      await sendWebhook(notification, channel.config, context);
      break;
    case 'slack':
      await sendSlack(notification, channel.config, context);
      break;
    case 'database':
      await sendToDatabase(notification, channel.config, context);
      break;
    case 'console':
      sendToConsole(notification, context);
      break;
  }
};

const sendEmail = async (notification: any, config: any, context: { logger: (msg: string, level?: 'info' | 'warn' | 'error') => void }): Promise<void> => {
  context.logger(`[EMAIL] ${notification.type}: ${JSON.stringify(notification.data)}`, 'info');
};

const sendWebhook = async (notification: any, config: any, context: { logger: (msg: string, level?: 'info' | 'warn' | 'error') => void }): Promise<void> => {
  context.logger(`[WEBHOOK] ${notification.type}: ${JSON.stringify(notification.data)}`, 'info');
};

const sendSlack = async (notification: any, config: any, context: { logger: (msg: string, level?: 'info' | 'warn' | 'error') => void }): Promise<void> => {
  context.logger(`[SLACK] ${notification.type}: ${JSON.stringify(notification.data)}`, 'info');
};

const sendToDatabase = async (notification: any, config: any, context: { logger: (msg: string, level?: 'info' | 'warn' | 'error') => void }): Promise<void> => {
  context.logger(`[DATABASE] ${notification.type}: ${JSON.stringify(notification.data)}`, 'info');
};

const sendToConsole = (notification: any, context: { logger: (msg: string, level?: 'info' | 'warn' | 'error') => void }): void => {
  const emoji = getSeverityEmoji(notification.severity);
  context.logger(`${emoji} [${notification.severity.toUpperCase()}] ${notification.type}: ${JSON.stringify(notification.data)}`, 'info');
};

const getSeverityEmoji = (severity: string): string => {
  switch (severity) {
    case 'low': return 'ℹ️';
    case 'medium': return '⚠️';
    case 'high': return '🚨';
    case 'critical': return '💥';
    default: return '📢';
  }
};

const isSuspiciousActivity = (data: HookData): boolean => {
  // Implementar lógica para detectar atividade suspeita
  // Exemplo: muitas tentativas de acesso negado em pouco tempo
  return false; // Placeholder
};

// Funções utilitárias para configurar canais

export const createNotificationUtils = (plugin: Plugin) => {
  return {
    addEmailChannel: (config: { smtp: any; from: string; to: string[] }) => {
      // Implementar adição de canal de email
    },
    addWebhookChannel: (config: { url: string; headers?: Record<string, string> }) => {
      // Implementar adição de canal webhook
    },
    addSlackChannel: (config: { webhookUrl: string; channel: string }) => {
      // Implementar adição de canal Slack
    },
    getStats: () => ({
      totalSent: 0,
      errors: 0,
      queueSize: 0
    })
  };
};
