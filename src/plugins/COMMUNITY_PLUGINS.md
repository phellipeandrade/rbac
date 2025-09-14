# Plugins da Comunidade para RBAC

Este documento explica como criar, instalar e usar plugins da comunidade para o sistema RBAC.

## 🚀 Instalação de Plugins da Comunidade

### Instalação via NPM

```bash
# Instalar um plugin da comunidade
npm install @rbac/plugin-cache
npm install @rbac/plugin-notifications
npm install rbac-plugin-custom
```

### Uso Automático

```typescript
import RBAC from '@rbac/rbac';
import { createRBACWithAutoPlugins } from '@rbac/rbac/plugins';

// Criar RBAC básico
const rbac = RBAC()({
  user: { can: ['products:read'] },
  admin: { can: ['products:*'], inherits: ['user'] }
});

// RBAC com plugins da comunidade carregados automaticamente
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

// Usar normalmente - os plugins funcionam automaticamente
const canRead = await rbacWithPlugins.can('user', 'products:read');
```

## 🛠 Criando um Plugin da Comunidade

### 1. Estrutura do Projeto

```
meu-plugin-rbac/
├── src/
│   └── index.ts
├── dist/
├── package.json
├── tsconfig.json
└── README.md
```

### 2. Package.json

```json
{
  "name": "@rbac/plugin-meu-plugin",
  "version": "1.0.0",
  "description": "Meu plugin para RBAC",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "rbacPlugin": {
    "name": "meu-plugin",
    "version": "1.0.0",
    "factory": "createPlugin",
    "config": {
      "enabled": true,
      "priority": 50,
      "settings": {
        "customSetting": "valor padrão"
      }
    }
  },
  "keywords": ["rbac", "plugin", "authorization"],
  "author": "Seu Nome <seu@email.com>",
  "license": "MIT",
  "peerDependencies": {
    "@rbac/rbac": "^2.0.0"
  },
  "files": [
    "dist/**/*",
    "README.md"
  ],
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "npm run build"
  }
}
```

### 3. Código do Plugin

```typescript
// src/index.ts
import { Plugin, PluginConfig, PluginContext, HookData } from '@rbac/rbac/plugins';

export interface MeuPluginConfig extends PluginConfig {
  settings: {
    customSetting: string;
    enableLogging: boolean;
  };
}

export const createPlugin = (config: MeuPluginConfig): Plugin => ({
  metadata: {
    name: 'meu-plugin',
    version: '1.0.0',
    description: 'Meu plugin customizado para RBAC',
    author: 'Seu Nome <seu@email.com>',
    license: 'MIT',
    keywords: ['rbac', 'plugin', 'custom']
  },

  install: async (context: PluginContext) => {
    context.logger('Meu plugin instalado com sucesso!', 'info');
    
    // Configurar listeners de eventos
    context.events.on('plugin.installed', (data) => {
      if (config.settings.enableLogging) {
        context.logger(`Plugin instalado: ${data.plugin}`, 'info');
      }
    });
  },

  uninstall: () => {
    console.log('Meu plugin desinstalado!');
  },

  configure: async (newConfig: PluginConfig) => {
    // Atualizar configurações
    Object.assign(config, newConfig);
  },

  getHooks: () => ({
    beforePermissionCheck: async (data: HookData, context: PluginContext) => {
      if (config.settings.enableLogging) {
        context.logger(`Verificando: ${data.role} -> ${data.operation}`, 'info');
      }
      
      // Adicionar metadata customizada
      return {
        ...data,
        metadata: {
          ...data.metadata,
          customField: config.settings.customSetting,
          timestamp: new Date().toISOString()
        }
      };
    },

    afterPermissionCheck: async (data: HookData, context: PluginContext) => {
      if (config.settings.enableLogging && data.result === false) {
        context.logger(`Acesso negado: ${data.role} -> ${data.operation}`, 'warn');
      }
      
      return data;
    },

    onError: async (data: HookData, context: PluginContext) => {
      context.logger(`Erro no meu plugin: ${data.error?.message}`, 'error');
      return data;
    }
  })
});

export default createPlugin;
```

### 4. Compilação

```bash
# Instalar dependências
npm install typescript @types/node

# Compilar
npm run build

# Publicar
npm publish
```

## 🔧 CLI para Gerenciar Plugins

### Instalação do CLI

```bash
# Instalar globalmente
npm install -g @rbac/rbac

# Ou usar via npx
npx @rbac/rbac plugin --help
```

### Comandos Disponíveis

```bash
# Listar plugins instalados
rbac-plugin list

# Validar plugin específico
rbac-plugin validate @rbac/plugin-cache

# Verificar status do plugin
rbac-plugin status @rbac/plugin-cache

# Gerar template de plugin
rbac-plugin generate meu-novo-plugin

# Mostrar ajuda
rbac-plugin help
```

## 📋 Convenções para Plugins

### Nomenclatura

- **NPM Package**: `@rbac/plugin-{nome}` ou `rbac-plugin-{nome}`
- **Plugin Name**: `{nome}` (sem prefixos)
- **Factory Function**: `createPlugin` (obrigatório)

### Estrutura Obrigatória

```typescript
interface Plugin {
  metadata: {
    name: string;        // Nome único do plugin
    version: string;     // Versão semver
    description: string; // Descrição clara
    author: string;      // Nome e email do autor
    license: string;     // Licença (MIT recomendada)
    keywords: string[];  // Palavras-chave para busca
  };
  
  install: (context: PluginContext) => Promise<void> | void;
  uninstall: () => Promise<void> | void;
  configure?: (config: PluginConfig) => Promise<void> | void;
  getHooks?: () => Record<HookType, HookHandler>;
}
```

### Hooks Disponíveis

- `beforePermissionCheck`: Antes de verificar permissão
- `afterPermissionCheck`: Após verificar permissão
- `beforeRoleUpdate`: Antes de atualizar roles
- `afterRoleUpdate`: Após atualizar roles
- `beforeRoleAdd`: Antes de adicionar role
- `afterRoleAdd`: Após adicionar role
- `onError`: Quando ocorre erro

## 🔒 Segurança e Validação

### Validação Automática

O sistema valida automaticamente:
- ✅ Estrutura do plugin
- ✅ Metadata obrigatória
- ✅ Funções obrigatórias
- ✅ Compatibilidade de versão
- ⚠️ Código suspeito (eval, Function)
- ⚠️ Dependências não verificadas

### Boas Práticas de Segurança

1. **Não use `eval()` ou `Function()`**
2. **Valide todas as entradas**
3. **Use apenas dependências confiáveis**
4. **Implemente cleanup no `uninstall`**
5. **Trate erros adequadamente**

## 🎯 Exemplos de Plugins da Comunidade

### Plugin de Cache Redis

```typescript
export const createPlugin = (config: PluginConfig): Plugin => ({
  metadata: {
    name: 'redis-cache',
    version: '1.0.0',
    description: 'Cache usando Redis para RBAC',
    author: 'Comunidade',
    license: 'MIT'
  },

  install: async (context) => {
    // Conectar ao Redis
    const redis = new Redis(config.settings.redisUrl);
    context.logger('Redis cache conectado', 'info');
  },

  getHooks: () => ({
    beforePermissionCheck: async (data, context) => {
      const cacheKey = `rbac:${data.role}:${data.operation}`;
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        return { ...data, result: JSON.parse(cached), metadata: { ...data.metadata, fromCache: true } };
      }
      
      return data;
    },

    afterPermissionCheck: async (data, context) => {
      if (data.result !== undefined) {
        const cacheKey = `rbac:${data.role}:${data.operation}`;
        await redis.setex(cacheKey, 300, JSON.stringify(data.result));
      }
      return data;
    }
  })
});
```

### Plugin de Auditoria

```typescript
export const createPlugin = (config: PluginConfig): Plugin => ({
  metadata: {
    name: 'audit-log',
    version: '1.0.0',
    description: 'Log de auditoria para verificações de permissão',
    author: 'Comunidade',
    license: 'MIT'
  },

  getHooks: () => ({
    afterPermissionCheck: async (data, context) => {
      // Log para banco de dados ou arquivo
      await auditLogger.log({
        userId: data.metadata?.userId,
        role: data.role,
        operation: data.operation,
        result: data.result,
        timestamp: new Date(),
        ip: data.metadata?.ipAddress
      });
      
      return data;
    }
  })
});
```

## 🐛 Debugging e Troubleshooting

### Verificar Plugins Instalados

```typescript
import { listAvailablePlugins } from '@rbac/rbac/plugins';

const plugins = await listAvailablePlugins();
console.log('Plugins disponíveis:', plugins);
```

### Verificar Status de Plugin

```typescript
import { getPluginStatus } from '@rbac/rbac/plugins';

const status = await getPluginStatus('@rbac/plugin-cache');
console.log('Status:', status);
```

### Logs de Debug

```typescript
const rbacWithPlugins = await createRBACWithAutoPlugins(rbac, {
  validatePlugins: true,
  strictMode: false // Para não falhar em plugins com avisos
});
```

## 📚 Recursos Adicionais

- [Documentação Principal dos Plugins](./README.md)
- [Exemplos de Plugins](./functional-examples/)
- [Template de Plugin](./community-template.ts)
- [CLI de Plugins](./cli.ts)

## 🤝 Contribuindo

Para contribuir com plugins:

1. Siga as convenções de nomenclatura
2. Implemente validação adequada
3. Adicione testes
4. Documente o uso
5. Publique no NPM
6. Submeta um PR para listar na documentação

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes.
