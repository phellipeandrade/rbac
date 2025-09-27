# Sistema de Plugins Funcional para RBAC

Este sistema de plugins permite estender e personalizar o comportamento do RBAC de forma funcional e modular.

## 🚀 Características

- **Abordagem Funcional**: Sem classes, apenas funções puras
- **Hooks Flexíveis**: Intercepte e modifique o comportamento do RBAC
- **Plugins Modulares**: Instale e desinstale plugins dinamicamente
- **Sistema de Eventos**: Comunicação entre plugins e sistema
- **Configuração Simples**: Configuração baseada em objetos
- **TypeScript**: Suporte completo a tipos

## 📦 Instalação

```typescript
import { createRBACWithPlugins, createCachePlugin } from '@rbac/rbac/plugins';
```

### Plugins da Comunidade

```typescript
import { createRBACWithAutoPlugins } from '@rbac/rbac/plugins';

// Carrega automaticamente plugins instalados via npm
const rbacWithPlugins = await createRBACWithAutoPlugins(rbac);
```

## 🎯 Uso Básico

### 1. Criar RBAC com Sistema de Plugins

```typescript
import RBAC from '@rbac/rbac';
import { createRBACWithPlugins } from '@rbac/rbac/plugins';

// Criar RBAC básico
const rbac = RBAC()({
  user: { can: ['products:read'] },
  admin: { can: ['products:*'], inherits: ['user'] }
});

// Adicionar sistema de plugins
const rbacWithPlugins = createRBACWithPlugins(rbac);
```

### 2. Instalar Plugins

```typescript
import { createCachePlugin, createNotificationPlugin } from '@rbac/rbac/plugins';

// Instalar plugin de cache
await rbacWithPlugins.pluginSystem.install(
  createCachePlugin({
    enabled: true,
    priority: 50,
    settings: {
      ttl: 300, // 5 minutos
      maxSize: 1000,
      strategy: 'lru'
    }
  })
);

// Instalar plugin de notificações
await rbacWithPlugins.pluginSystem.install(
  createNotificationPlugin({
    enabled: true,
    priority: 40,
    settings: {
      enableRealTime: true,
      channels: [
        {
          type: 'console',
          config: {},
          events: ['permission.denied']
        }
      ]
    }
  })
);
```

### 3. Usar RBAC com Plugins

```typescript
// O RBAC funciona normalmente, mas agora com plugins ativos
const canRead = await rbacWithPlugins.can('user', 'products:read');
const canWrite = await rbacWithPlugins.can('user', 'products:write');

console.log('Pode ler:', canRead); // true
console.log('Pode escrever:', canWrite); // false
```

## 🔧 Criando Plugins Customizados

### Estrutura Básica de um Plugin

```typescript
const meuPlugin = {
  metadata: {
    name: 'meu-plugin',
    version: '1.0.0',
    description: 'Meu plugin customizado',
    author: 'Seu Nome',
    keywords: ['custom', 'example']
  },

  install: async (context) => {
    context.logger('Plugin instalado!', 'info');
  },

  uninstall: () => {
    console.log('Plugin desinstalado!');
  },

  getHooks: () => ({
    beforePermissionCheck: async (data, context) => {
      // Lógica antes da verificação de permissão
      return data;
    },

    afterPermissionCheck: async (data, context) => {
      // Lógica após a verificação de permissão
      return data;
    }
  })
};

// Instalar plugin
await rbacWithPlugins.pluginSystem.install(meuPlugin);
```

### Hooks Disponíveis

- `beforePermissionCheck`: Antes de verificar permissão
- `afterPermissionCheck`: Após verificar permissão
- `beforeRoleUpdate`: Antes de atualizar roles
- `afterRoleUpdate`: Após atualizar roles
- `beforeRoleAdd`: Antes de adicionar role
- `afterRoleAdd`: Após adicionar role
- `onError`: Quando ocorre erro

### Modificando Dados nos Hooks

```typescript
const modifierPlugin = {
  metadata: { name: 'modifier', version: '1.0.0', description: 'Modifica dados' },
  
  install: async (context) => {},
  uninstall: () => {},

  getHooks: () => ({
    beforePermissionCheck: async (data, context) => {
      // Modificar dados antes da verificação
      return {
        ...data,
        metadata: {
          ...data.metadata,
          customField: 'valor customizado'
        }
      };
    }
  })
};
```

## 🛠 Plugins Incluídos

### Cache Plugin

Otimiza verificações de permissão com cache em memória.

```typescript
import { createCachePlugin } from '@rbac/rbac/plugins';

const cachePlugin = createCachePlugin({
  enabled: true,
  priority: 50,
  settings: {
    ttl: 300,        // Time to live em segundos
    maxSize: 1000,   // Tamanho máximo do cache
    strategy: 'lru'  // Estratégia de remoção: 'lru', 'fifo', 'ttl'
  }
});
```

### Notification Plugin

Envia notificações para eventos de segurança.

```typescript
import { createNotificationPlugin } from '@rbac/rbac/plugins';

const notificationPlugin = createNotificationPlugin({
  enabled: true,
  priority: 40,
  settings: {
    enableRealTime: true,
    channels: [
      {
        type: 'console',
        config: {},
        events: ['permission.denied', 'suspicious.activity']
      }
    ]
  }
});
```

### Validation Plugin

Valida roles, operações e parâmetros.

```typescript
import { createValidationPlugin } from '@rbac/rbac/plugins';

const validationPlugin = createValidationPlugin({
  enabled: true,
  priority: 60,
  settings: {
    strictMode: false,
    validateRoles: true,
    validateOperations: true,
    validateParams: true
  }
});
```

## 🎣 Hooks Utilitários

### Criar Hooks Personalizados

```typescript
import { createHookUtils } from '@rbac/rbac/plugins';

const hooks = createHookUtils();

// Hook de logging
const logger = hooks.createLogger('info');

// Hook de validação
const validator = hooks.createValidator((data) => {
  return data.role !== 'invalid';
});

// Hook modificador
const modifier = hooks.createModifier((data) => ({
  ...data,
  metadata: { ...data.metadata, processed: true }
}));

// Hook filtro
const filter = hooks.createFilter((data) => {
  return data.role !== 'blocked';
});

// Filtro de horário comercial
const businessHours = hooks.createBusinessHoursFilter();

// Filtro de usuários
const userFilter = hooks.createUserFilter(['user1', 'user2']);
```

## 📊 Gerenciamento de Plugins

### Listar Plugins

```typescript
const plugins = rbacWithPlugins.pluginSystem.getPlugins();
console.log(plugins.map(p => p.name));
```

### Obter Plugin Específico

```typescript
const plugin = rbacWithPlugins.pluginSystem.getPlugin('meu-plugin');
if (plugin) {
  console.log('Plugin encontrado:', plugin.metadata);
}
```

### Habilitar/Desabilitar Plugins

```typescript
// Desabilitar plugin
await rbacWithPlugins.pluginSystem.disable('meu-plugin');

// Reabilitar plugin
await rbacWithPlugins.pluginSystem.enable('meu-plugin');
```

### Desinstalar Plugin

```typescript
await rbacWithPlugins.pluginSystem.uninstall('meu-plugin');
```

## 🔄 Sistema de Eventos

### Escutar Eventos

```typescript
// No contexto do plugin
context.events.on('plugin.installed', (data) => {
  console.log('Plugin instalado:', data.plugin);
});

context.events.on('plugin.error', (data) => {
  console.log('Erro no plugin:', data.plugin, data.error);
});
```

### Emitir Eventos

```typescript
context.events.emit('custom.event', {
  type: 'custom',
  data: { message: 'Evento customizado' }
});
```

## 🏗 Exemplos Avançados

### Plugin de Middleware Express

```typescript
export const createExpressMiddlewarePlugin = (app) => ({
  metadata: {
    name: 'express-middleware',
    version: '1.0.0',
    description: 'Integração com Express.js'
  },

  install: async (context) => {
    context.logger('Express middleware instalado', 'info');
  },

  uninstall: () => {},

  getHooks: () => ({
    beforePermissionCheck: async (data, context) => {
      // Adicionar informações da requisição HTTP
      return {
        ...data,
        metadata: {
          ...data.metadata,
          httpMethod: 'GET',
          userAgent: 'Mozilla/5.0...',
          ipAddress: '192.168.1.1'
        }
      };
    }
  })
});
```

### Plugin de Cache Redis

```typescript
export const createRedisCachePlugin = (redisClient) => ({
  metadata: {
    name: 'redis-cache',
    version: '1.0.0',
    description: 'Cache usando Redis'
  },

  install: async (context) => {
    context.logger('Redis cache instalado', 'info');
  },

  uninstall: () => {},

  getHooks: () => ({
    beforePermissionCheck: async (data, context) => {
      const cacheKey = `rbac:${data.role}:${data.operation}`;
      const cached = await redisClient.get(cacheKey);
      
      if (cached !== null) {
        return {
          ...data,
          result: JSON.parse(cached),
          metadata: { ...data.metadata, fromCache: true }
        };
      }

      return data;
    },

    afterPermissionCheck: async (data, context) => {
      if (data.result !== undefined) {
        const cacheKey = `rbac:${data.role}:${data.operation}`;
        await redisClient.setex(cacheKey, 300, JSON.stringify(data.result));
      }

      return data;
    }
  })
});
```

## 🐛 Debugging

### Logs de Plugins

```typescript
// No contexto do plugin
context.logger('Mensagem de info', 'info');
context.logger('Aviso importante', 'warn');
context.logger('Erro crítico', 'error');
```

### Verificar Estado dos Plugins

```typescript
const plugins = rbacWithPlugins.pluginSystem.getPlugins();
plugins.forEach(plugin => {
  console.log(`${plugin.name}: ${plugin.config.enabled ? 'Habilitado' : 'Desabilitado'}`);
});
```

## 📝 Boas Práticas

1. **Nomes Únicos**: Use nomes únicos para seus plugins
2. **Versionamento**: Sempre especifique uma versão
3. **Cleanup**: Implemente limpeza no método `uninstall`
4. **Error Handling**: Trate erros adequadamente
5. **Performance**: Considere o impacto na performance
6. **Configuração**: Torne seus plugins configuráveis
7. **Documentação**: Documente seu plugin adequadamente

## 🌟 Plugins da Comunidade

### Instalação de Plugins

```bash
# Instalar plugins da comunidade via npm
npm install @rbac/plugin-cache
npm install @rbac/plugin-notifications
npm install rbac-plugin-custom
```

### Uso Automático

```typescript
import { createRBACWithAutoPlugins } from '@rbac/rbac/plugins';

// Plugins são carregados automaticamente
const rbacWithPlugins = await createRBACWithAutoPlugins(rbac, {
  autoLoadCommunityPlugins: true,
  pluginConfigs: {
    'cache-plugin': {
      enabled: true,
      priority: 60,
      settings: { ttl: 300 }
    }
  }
});
```

### CLI para Gerenciar Plugins

```bash
# Listar plugins instalados
rbac-plugin list

# Validar plugin
rbac-plugin validate @rbac/plugin-cache

# Gerar template de plugin
rbac-plugin generate meu-plugin
```

### Criando Plugins da Comunidade

Veja a [documentação completa](./COMMUNITY_PLUGINS.md) para criar seus próprios plugins.

## 🤝 Contribuindo

Para contribuir com plugins:

1. Crie seu plugin seguindo a estrutura funcional
2. Adicione testes
3. Documente o uso
4. Publique no NPM com convenção `@rbac/plugin-*` ou `rbac-plugin-*`
5. Submeta um pull request para listar na documentação

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes.
