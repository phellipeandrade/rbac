import type { RBACInstance } from '../types';
import { BaseMiddlewareOptions } from './types';
import { NestExecutionContext, NestHttpResponse, NestNextFunction } from './nest.types';

export interface NestOptions<P = unknown> extends BaseMiddlewareOptions<P> {
  getRole?: (req: NestExecutionContext) => string;
  getParams?: (req: NestExecutionContext) => P;
  onDenied?: (req: NestExecutionContext, res: NestHttpResponse, next: NestNextFunction) => void;
}

export const createNestMiddleware =
  <P>(rbac: RBACInstance<P>) =>
  (operation: string | RegExp, options: NestOptions<P> = {}) =>
  async (req: NestExecutionContext, res: NestHttpResponse, next: NestNextFunction): Promise<void> => {
    try {
      const role = options.getRole ? options.getRole(req) : (req as any).role;
      const params = options.getParams ? options.getParams(req) : undefined;
      const allowed = await rbac.can(role, operation, params as P);
      if (allowed) return next();
      if (options.onDenied) return options.onDenied(req, res, next);
      res.status(403).send('Forbidden');
    } catch (err) {
      next(err);
    }
  };

export default createNestMiddleware;
