import { RBACPlugin, PluginContext, PluginConfig, PluginMetadata, MiddlewarePlugin } from '../types';

interface MiddlewareConfig {
  enableCORS: boolean;
  enableRateLimit: boolean;
  enableSecurityHeaders: boolean;
  enableRequestLogging: boolean;
  rateLimitConfig: {
    windowMs: number;
    max: number;
    message: string;
  };
  corsConfig: {
    origin: string | string[];
    methods: string[];
    allowedHeaders: string[];
  };
}

/**
 * Plugin de middleware para Express, Fastify e NestJS
 */
export class MiddlewarePlugin<P = unknown> implements MiddlewarePlugin<P> {
  metadata: PluginMetadata = {
    name: 'rbac-middleware',
    version: '1.0.0',
    description: 'Plugin de middleware para frameworks web com RBAC',
    author: 'RBAC Team',
    license: 'MIT',
    keywords: ['middleware', 'express', 'fastify', 'nestjs', 'web', 'security']
  };

  private config: MiddlewareConfig = {
    enableCORS: true,
    enableRateLimit: true,
    enableSecurityHeaders: true,
    enableRequestLogging: true,
    rateLimitConfig: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // máximo 100 requests por IP
      message: 'Muitas tentativas, tente novamente mais tarde'
    },
    corsConfig: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }
  };

  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();

  async install(context: PluginContext<P>): Promise<void> {
    context.logger('MiddlewarePlugin instalado', 'info');
  }

  async uninstall(): Promise<void> {
    this.requestCounts.clear();
  }

  configure(config: PluginConfig): void {
    if (config.settings) {
      this.config = { ...this.config, ...config.settings };
    }
  }

  // Middleware para Express
  createExpressMiddleware() {
    return (req: any, res: any, next: any) => {
      this.processRequest(req, res, next);
    };
  }

  // Middleware para Fastify
  createFastifyMiddleware() {
    return async (request: any, reply: any) => {
      return this.processFastifyRequest(request, reply);
    };
  }

  // Middleware para NestJS
  createNestMiddleware() {
    return (req: any, res: any, next: any) => {
      this.processRequest(req, res, next);
    };
  }

  // Middleware de CORS
  createCorsMiddleware() {
    return (req: any, res: any, next: any) => {
      if (!this.config.enableCORS) {
        return next();
      }

      const origin = req.headers.origin;
      const allowedOrigins = Array.isArray(this.config.corsConfig.origin) 
        ? this.config.corsConfig.origin 
        : [this.config.corsConfig.origin];

      if (this.config.corsConfig.origin === '*' || allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin || '*');
      }

      res.header('Access-Control-Allow-Methods', this.config.corsConfig.methods.join(', '));
      res.header('Access-Control-Allow-Headers', this.config.corsConfig.allowedHeaders.join(', '));
      res.header('Access-Control-Allow-Credentials', 'true');

      if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
      }

      next();
    };
  }

  // Middleware de Rate Limiting
  createRateLimitMiddleware() {
    return (req: any, res: any, next: any) => {
      if (!this.config.enableRateLimit) {
        return next();
      }

      const clientId = this.getClientId(req);
      const now = Date.now();
      const windowMs = this.config.rateLimitConfig.windowMs;
      const max = this.config.rateLimitConfig.max;

      const clientData = this.requestCounts.get(clientId);

      if (!clientData || now > clientData.resetTime) {
        // Nova janela de tempo
        this.requestCounts.set(clientId, {
          count: 1,
          resetTime: now + windowMs
        });
        return next();
      }

      if (clientData.count >= max) {
        res.status(429).json({
          error: this.config.rateLimitConfig.message,
          retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
        });
        return;
      }

      clientData.count++;
      next();
    };
  }

  // Middleware de Security Headers
  createSecurityHeadersMiddleware() {
    return (req: any, res: any, next: any) => {
      if (!this.config.enableSecurityHeaders) {
        return next();
      }

      // Prevenir clickjacking
      res.header('X-Frame-Options', 'DENY');
      
      // Prevenir MIME type sniffing
      res.header('X-Content-Type-Options', 'nosniff');
      
      // Habilitar XSS protection
      res.header('X-XSS-Protection', '1; mode=block');
      
      // Forçar HTTPS
      res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      
      // Referrer Policy
      res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // Content Security Policy
      res.header('Content-Security-Policy', "default-src 'self'");
      
      next();
    };
  }

  // Middleware de Logging
  createLoggingMiddleware() {
    return (req: any, res: any, next: any) => {
      if (!this.config.enableRequestLogging) {
        return next();
      }

      const startTime = Date.now();
      const originalEnd = res.end;

      res.end = function(...args: any[]) {
        const duration = Date.now() - startTime;
        const logData = {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          userAgent: req.get('User-Agent'),
          ip: req.ip || req.connection.remoteAddress,
          timestamp: new Date().toISOString()
        };

        console.log(`[REQUEST] ${JSON.stringify(logData)}`);
        originalEnd.apply(res, args);
      };

      next();
    };
  }

  // Middleware de Autenticação
  createAuthMiddleware() {
    return (req: any, res: any, next: any) => {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        res.status(401).json({ error: 'Token de autorização necessário' });
        return;
      }

      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : authHeader;

      // Aqui você implementaria a validação do token
      // Por exemplo, com JWT
      try {
        // const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // req.user = decoded;
        next();
      } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
      }
    };
  }

  // Middleware de RBAC
  createRBACMiddleware(operation: string) {
    return (req: any, res: any, next: any) => {
      // Este seria integrado com o sistema RBAC principal
      // Por simplicidade, sempre permite
      next();
    };
  }

  // Métodos privados

  private processRequest(req: any, res: any, next: any): void {
    // Aplicar middlewares em sequência
    this.createCorsMiddleware()(req, res, () => {
      this.createRateLimitMiddleware()(req, res, () => {
        this.createSecurityHeadersMiddleware()(req, res, () => {
          this.createLoggingMiddleware()(req, res, () => {
            this.createAuthMiddleware()(req, res, next);
          });
        });
      });
    });
  }

  private async processFastifyRequest(request: any, reply: any): Promise<void> {
    // Implementação específica para Fastify
    // Aplicar middlewares equivalentes
    this.createCorsMiddleware()(request, reply, () => {
      this.createRateLimitMiddleware()(request, reply, () => {
        this.createSecurityHeadersMiddleware()(request, reply, () => {
          this.createLoggingMiddleware()(request, reply, () => {
            // Continuar processamento
          });
        });
      });
    });
  }

  private getClientId(req: any): string {
    // Usar IP + User-Agent para identificar cliente
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    return `${ip}-${Buffer.from(userAgent).toString('base64')}`;
  }

  // Métodos de configuração

  updateRateLimitConfig(config: Partial<typeof this.config.rateLimitConfig>): void {
    this.config.rateLimitConfig = { ...this.config.rateLimitConfig, ...config };
  }

  updateCorsConfig(config: Partial<typeof this.config.corsConfig>): void {
    this.config.corsConfig = { ...this.config.corsConfig, ...config };
  }

  // Métodos de estatísticas

  getRateLimitStats(): {
    activeClients: number;
    totalRequests: number;
    blockedRequests: number;
  } {
    const now = Date.now();
    let totalRequests = 0;
    let blockedRequests = 0;

    // Limpar entradas expiradas
    for (const [clientId, data] of this.requestCounts) {
      if (now > data.resetTime) {
        this.requestCounts.delete(clientId);
      } else {
        totalRequests += data.count;
        if (data.count >= this.config.rateLimitConfig.max) {
          blockedRequests++;
        }
      }
    }

    return {
      activeClients: this.requestCounts.size,
      totalRequests,
      blockedRequests
    };
  }

  // Métodos de utilidade

  createErrorHandler() {
    return (error: any, req: any, res: any, next: any) => {
      console.error('Erro no middleware:', error);
      
      res.status(error.status || 500).json({
        error: error.message || 'Erro interno do servidor',
        timestamp: new Date().toISOString(),
        path: req.path
      });
    };
  }

  createNotFoundHandler() {
    return (req: any, res: any) => {
      res.status(404).json({
        error: 'Endpoint não encontrado',
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    };
  }
}
