import type { RBACInstance } from '../types';
import type { BaseMiddlewareOptions } from './types';
import type { NestExecutionContext, NestNextFunction, NestRequest, NestResponse } from './nest.types';

export type NestOptions<P = unknown> = BaseMiddlewareOptions<P, NestRequest, NestResponse, NestNextFunction>;

/** NestMiddleware.use(req, res, next), compatible with the existing API. */
export const createNestMiddleware =
  <P>(rbac: RBACInstance<P>) =>
  (operation: string | RegExp, options: NestOptions<P> = {}) =>
  async (req: NestRequest, res: NestResponse, next: NestNextFunction): Promise<void> => {
    try {
      const role = options.getRole ? options.getRole(req) : req.role;
      const params = options.getParams ? options.getParams(req) : undefined;
      const allowed = await rbac.can(role ?? '', operation, params);
      if (allowed) return next();
      if (options.onDenied) return options.onDenied(req, res, next);
      res.status(403).send('Forbidden');
    } catch (err) {
      next(err);
    }
  };

/** Nest CanActivate-style guard; returning false lets Nest issue HTTP 403. */
export const createNestGuard =
  <P>(rbac: RBACInstance<P>) =>
  (operation: string | RegExp, options: Pick<NestOptions<P>, 'getRole' | 'getParams'> = {}) => ({
    async canActivate(context: NestExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const role = options.getRole ? options.getRole(request) : request.role;
      const params = options.getParams?.(request);
      return rbac.can(role ?? '', operation, params);
    }
  });

export default createNestMiddleware;
