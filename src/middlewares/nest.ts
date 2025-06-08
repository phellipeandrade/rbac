import type { RBACInstance } from '../types';
import { BaseMiddlewareOptions } from './types';

type NextFunction = (err?: unknown) => void;

export interface NestOptions<P = unknown> extends BaseMiddlewareOptions<P> {
  getRole?: (req: any) => string;
  getParams?: (req: any) => P;
  onDenied?: (req: any, res: any, next: (err?: unknown) => void) => void;
}

export const createNestMiddleware =
  <P>(rbac: RBACInstance<P>) =>
  (operation: string | RegExp, options: NestOptions<P> = {}) =>
  async (req: any, res: any, next: (err?: unknown) => void): Promise<void> => {
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
