import { Plugin, PluginConfig, PluginContext, HookData, HookType } from '../functional-types';

// Estado do cache
interface CacheState {
  cache: Map<string, { value: any; timestamp: number; ttl: number }>;
  config: {
    ttl: number;
    maxSize: number;
    strategy: 'lru' | 'fifo' | 'ttl';
  };
  stats: {
    hits: number;
    misses: number;
  };
}

// Criar estado inicial do cache
const createCacheState = (config: any): CacheState => ({
  cache: new Map(),
  config: {
    ttl: 300, // 5 minutos
    maxSize: 1000,
    strategy: 'lru',
    ...config
  },
  stats: {
    hits: 0,
    misses: 0
  }
});

// Plugin de cache funcional
export const createCachePlugin = (config: PluginConfig = { enabled: true, priority: 50, settings: {} }): Plugin => {
  let state: CacheState | null = null;

  return {
    metadata: {
      name: 'rbac-cache',
      version: '1.0.0',
      description: 'Plugin de cache para otimizar verificações de permissão',
      author: 'RBAC Team',
      license: 'MIT',
      keywords: ['cache', 'performance', 'optimization']
    },

    install: async (context: PluginContext) => {
      state = createCacheState(config.settings);
      context.logger('CachePlugin instalado', 'info');
      
      // Configurar limpeza automática
      setInterval(() => {
        if (state) {
          cleanExpiredEntries(state);
        }
      }, 60000); // Limpar a cada minuto
    },

    uninstall: () => {
      if (state) {
        state.cache.clear();
        state = null;
      }
    },

    configure: (newConfig: PluginConfig) => {
      if (state && newConfig.settings) {
        state.config = { ...state.config, ...newConfig.settings };
      }
    },

    getHooks: () => ({
      beforePermissionCheck: async (data: HookData, context: PluginContext) => {
        if (!state) return data;

        const cacheKey = generateCacheKey(data.role, data.operation, data.params);
        const cached = getFromCache(state, cacheKey);

        if (cached !== undefined) {
          context.logger(`Cache hit para ${cacheKey}`, 'info');
          return {
            ...data,
            result: cached,
            metadata: {
              ...data.metadata,
              fromCache: true,
              cacheKey
            }
          };
        }

        return data;
      },

      afterPermissionCheck: async (data: HookData, context: PluginContext) => {
        if (!state || data.result === undefined) return data;

        const cacheKey = generateCacheKey(data.role, data.operation, data.params);
        setInCache(state, cacheKey, data.result, state.config.ttl);
        context.logger(`Resultado armazenado no cache: ${cacheKey}`, 'info');

        return data;
      },

      beforeRoleUpdate: async (data: HookData, context: PluginContext) => data,
      afterRoleUpdate: async (data: HookData, context: PluginContext) => data,
      beforeRoleAdd: async (data: HookData, context: PluginContext) => data,
      afterRoleAdd: async (data: HookData, context: PluginContext) => data,
      onError: async (data: HookData, context: PluginContext) => data
    })
  };
};

// Funções auxiliares do cache

const generateCacheKey = (role: string, operation: string | RegExp, params?: any): string => {
  const operationStr = typeof operation === 'string' ? operation : operation.source;
  const paramsStr = params ? JSON.stringify(params) : '';
  return `rbac:${role}:${operationStr}:${btoa(paramsStr)}`;
};

const getFromCache = (state: CacheState, key: string): any => {
  const entry = state.cache.get(key);
  
  if (!entry) {
    state.stats.misses++;
    return undefined;
  }

  // Verificar se expirou
  if (Date.now() - entry.timestamp > entry.ttl * 1000) {
    state.cache.delete(key);
    state.stats.misses++;
    return undefined;
  }

  state.stats.hits++;
  return entry.value;
};

const setInCache = (state: CacheState, key: string, value: any, ttl: number): void => {
  // Verificar limite de tamanho
  if (state.cache.size >= state.config.maxSize) {
    evictEntry(state);
  }

  state.cache.set(key, {
    value,
    timestamp: Date.now(),
    ttl
  });
};

const evictEntry = (state: CacheState): void => {
  switch (state.config.strategy) {
    case 'lru':
      // Implementação simples de LRU - remover o primeiro (mais antigo)
      const firstKey = state.cache.keys().next().value;
      if (firstKey) {
        state.cache.delete(firstKey);
      }
      break;
    case 'fifo':
      // FIFO - mesma implementação para este exemplo
      const firstKeyFifo = state.cache.keys().next().value;
      if (firstKeyFifo) {
        state.cache.delete(firstKeyFifo);
      }
      break;
    case 'ttl':
      // Remover entrada com TTL mais próximo do vencimento
      let oldestKey: string | undefined;
      let oldestTime = Date.now();

      for (const [key, entry] of state.cache) {
        const expirationTime = entry.timestamp + (entry.ttl * 1000);
        if (expirationTime < oldestTime) {
          oldestTime = expirationTime;
          oldestKey = key;
        }
      }

      if (oldestKey) {
        state.cache.delete(oldestKey);
      }
      break;
  }
};

const cleanExpiredEntries = (state: CacheState): void => {
  const now = Date.now();
  const expiredKeys: string[] = [];

  for (const [key, entry] of state.cache) {
    if (now - entry.timestamp > entry.ttl * 1000) {
      expiredKeys.push(key);
    }
  }

  expiredKeys.forEach(key => state.cache.delete(key));
};

// Funções utilitárias para gerenciar o cache

export const createCacheUtils = (plugin: Plugin) => {
  // Estas funções seriam implementadas para acessar o estado interno do plugin
  // Por simplicidade, deixamos como placeholders
  return {
    getStats: () => ({
      size: 0,
      hits: 0,
      misses: 0,
      hitRate: 0
    }),
    clear: () => {
      // Implementar limpeza do cache
    },
    get: (key: string) => {
      // Implementar busca no cache
      return undefined;
    },
    set: (key: string, value: any, ttl?: number) => {
      // Implementar armazenamento no cache
    }
  };
};
