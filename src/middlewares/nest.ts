import type { RBACInstance } from '../types';

type Request = any;
type Response = any;
type NextFunction = (err?: unknown) => void;

<<<<<<< HEAD
import { MiddlewareOptions } from './types';

export interface NestOptions<P = unknown> extends MiddlewareOptions<P> {}
>>>>>>> master

export const createNestMiddleware =
  <P>(rbac: RBACInstance<P>) =>
  (operation: string | RegExp, options: NestOptions<P> = {}) =>
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

export default createNestMiddleware;
