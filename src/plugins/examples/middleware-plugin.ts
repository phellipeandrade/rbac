import { RBACPlugin, PluginContext, PluginConfig, PluginMetadata, MiddlewarePlugin as IMiddlewarePlugin } from '../types';

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
export class MiddlewarePlugin<P = unknown> implements IMiddlewarePlugin<P> {
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
    context.logger('MiddlewarePlugin installed', 'info');
  }

  async uninstall(): Promise<void> {
    this.requestCounts.clear();
  }

  configure(config: PluginConfig): void {
    if (config.settings) {
      this.config = { ...this.config, ...config.settings };
    }
  }

  createMiddleware(): (req: any, res: any, next: any) => void {
    return this.createExpressMiddleware();
  }

  // Middleware for Express
  createExpressMiddleware() {
    return (req: any, res: any, next: any) => {
      this.processRequest(req, res, next);
    };
  }

  // Middleware for Fastify
  createFastifyMiddleware() {
    return async (request: any, reply: any) => {
      return this.processFastifyRequest(request, reply);
    };
  }

  // Middleware for NestJS
  createNestMiddleware() {
    return (req: any, res: any, next: any) => {
      this.processRequest(req, res, next);
    };
  }

  // CORS Middleware
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

  // Rate Limiting Middleware
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
        // New time window
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

  // Security Headers Middleware
  createSecurityHeadersMiddleware() {
    return (req: any, res: any, next: any) => {
      if (!this.config.enableSecurityHeaders) {
        return next();
      }

      // Prevent clickjacking
      res.header('X-Frame-Options', 'DENY');
      
      // Prevent MIME type sniffing
      res.header('X-Content-Type-Options', 'nosniff');
      
      // Enable XSS protection
      res.header('X-XSS-Protection', '1; mode=block');
      
      // Force HTTPS
      res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      
      // Referrer Policy
      res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // Content Security Policy
      res.header('Content-Security-Policy', "default-src 'self'");
      
      next();
    };
  }

  // Logging Middleware
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

  // Authentication Middleware
  createAuthMiddleware() {
    return (req: any, res: any, next: any) => {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        res.status(401).json({ error: 'Authorization token required' });
        return;
      }

      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : authHeader;

      // Here you would implement token validation
      // For example, with JWT
      try {
        // const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // req.user = decoded;
        next();
      } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
      }
    };
  }

  // RBAC Middleware
  createRBACMiddleware(operation: string) {
    return (req: any, res: any, next: any) => {
      // This would be integrated with the main RBAC system
      // For simplicity, always allows
      next();
    };
  }

  // Private methods

  private processRequest(req: any, res: any, next: any): void {
    // Apply middlewares in sequence
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
    // Specific implementation for Fastify
    // Apply equivalent middlewares
    this.createCorsMiddleware()(request, reply, () => {
      this.createRateLimitMiddleware()(request, reply, () => {
        this.createSecurityHeadersMiddleware()(request, reply, () => {
          this.createLoggingMiddleware()(request, reply, () => {
            // Continue processing
          });
        });
      });
    });
  }

  private getClientId(req: any): string {
    // Use IP + User-Agent to identify client
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    return `${ip}-${Buffer.from(userAgent).toString('base64')}`;
  }

  // Configuration methods

  updateRateLimitConfig(config: Partial<typeof this.config.rateLimitConfig>): void {
    this.config.rateLimitConfig = { ...this.config.rateLimitConfig, ...config };
  }

  updateCorsConfig(config: Partial<typeof this.config.corsConfig>): void {
    this.config.corsConfig = { ...this.config.corsConfig, ...config };
  }

  // Statistics methods

  getRateLimitStats(): {
    activeClients: number;
    totalRequests: number;
    blockedRequests: number;
  } {
    const now = Date.now();
    let totalRequests = 0;
    let blockedRequests = 0;

    // Clean expired entries
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

  // Utility methods

  createErrorHandler() {
    return (error: any, req: any, res: any, next: any) => {
      console.error('Middleware error:', error);
      
      res.status(error.status || 500).json({
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString(),
        path: req.path
      });
    };
  }

  createNotFoundHandler() {
    return (req: any, res: any) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    };
  }
}
