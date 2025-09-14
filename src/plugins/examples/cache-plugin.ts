import { RBACPlugin, PluginContext, PluginConfig, PluginMetadata, HookData } from '../types';

interface CacheConfig {
  ttl: number; // Time to live em segundos
  maxSize: number; // Tamanho máximo do cache
  strategy: 'lru' | 'fifo' | 'ttl';
}

interface CacheEntry {
  value: any;
  timestamp: number;
  ttl: number;
}

/**
 * Plugin de cache para otimizar verificações de permissão
 */
export class CachePlugin<P = unknown> implements RBACPlugin<P> {
  metadata: PluginMetadata = {
    name: 'rbac-cache',
    version: '1.0.0',
    description: 'Plugin de cache para otimizar verificações de permissão',
    author: 'RBAC Team',
    license: 'MIT',
    keywords: ['cache', 'performance', 'optimization']
  };

  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig = {
    ttl: 300, // 5 minutos
    maxSize: 1000,
    strategy: 'lru'
  };

  async install(context: PluginContext<P>): Promise<void> {
    context.logger('CachePlugin instalado', 'info');
    
    // Configurar limpeza automática do cache
    setInterval(() => {
      this.cleanExpiredEntries();
    }, 60000); // Limpar a cada minuto
  }

  async uninstall(): Promise<void> {
    this.cache.clear();
  }

  configure(config: PluginConfig): void {
    if (config.settings) {
      this.config = { ...this.config, ...config.settings };
    }
  }

  getHooks() {
    return {
      beforePermissionCheck: this.beforePermissionCheck.bind(this),
      afterPermissionCheck: this.afterPermissionCheck.bind(this)
    };
  }

  private async beforePermissionCheck(data: HookData<P>, context: PluginContext<P>): Promise<HookData<P> | void> {
    const cacheKey = this.generateCacheKey(data.role, data.operation, data.params);
    const cached = this.get(cacheKey);

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
  }

  private async afterPermissionCheck(data: HookData<P>, context: PluginContext<P>): Promise<HookData<P> | void> {
    if (data.result !== undefined) {
      const cacheKey = this.generateCacheKey(data.role, data.operation, data.params);
      this.set(cacheKey, data.result, this.config.ttl);
      context.logger(`Resultado armazenado no cache: ${cacheKey}`, 'info');
    }

    return data;
  }

  // Métodos públicos para gerenciamento do cache

  get(key: string): any {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }

    // Verificar se expirou
    if (Date.now() - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: string, value: any, ttl: number = this.config.ttl): void {
    // Verificar limite de tamanho
    if (this.cache.size >= this.config.maxSize) {
      this.evictEntry();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Métodos privados

  private generateCacheKey(role: string, operation: string | RegExp, params?: P): string {
    const operationStr = typeof operation === 'string' ? operation : operation.source;
    const paramsStr = params ? JSON.stringify(params) : '';
    return `rbac:${role}:${operationStr}:${Buffer.from(paramsStr).toString('base64')}`;
  }

  private evictEntry(): void {
    switch (this.config.strategy) {
      case 'lru':
        this.evictLRU();
        break;
      case 'fifo':
        this.evictFIFO();
        break;
      case 'ttl':
        this.evictTTL();
        break;
    }
  }

  private evictLRU(): void {
    // Implementação simples de LRU - remover o primeiro (mais antigo)
    const firstKey = this.cache.keys().next().value;
    if (firstKey) {
      this.cache.delete(firstKey);
    }
  }

  private evictFIFO(): void {
    // FIFO - remover o primeiro adicionado
    this.evictLRU(); // Mesma implementação para este exemplo
  }

  private evictTTL(): void {
    // Remover entrada com TTL mais próximo do vencimento
    let oldestKey: string | undefined;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache) {
      const expirationTime = entry.timestamp + (entry.ttl * 1000);
      if (expirationTime < oldestTime) {
        oldestTime = expirationTime;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private cleanExpiredEntries(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl * 1000) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
  }

  // Métodos de estatísticas

  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    missCount: number;
    hitCount: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: this.hitCount / (this.hitCount + this.missCount) || 0,
      missCount: this.missCount,
      hitCount: this.hitCount
    };
  }

  private hitCount = 0;
  private missCount = 0;

  private incrementHit(): void {
    this.hitCount++;
  }

  private incrementMiss(): void {
    this.missCount++;
  }
}
