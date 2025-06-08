import type { RBACInstance } from '../types';
import { Request, Response, NextFunction } from 'express';
import { BaseMiddlewareOptions } from './types';

export interface ExpressOptions<P = unknown> extends BaseMiddlewareOptions<P> {
  getRole?: (req: Request) => string;
  getParams?: (req: Request) => P;
  onDenied?: (req: Request, res: Response, next: NextFunction) => void;
}

export const createExpressMiddleware =
  <P>(rbac: RBACInstance<P>) =>
  (operation: string | RegExp, options: ExpressOptions<P> = {}) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

export default createExpressMiddleware;
