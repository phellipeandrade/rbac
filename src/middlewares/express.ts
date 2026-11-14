import type { RBACInstance } from '../types';
import type { BaseMiddlewareOptions } from './types';

/** Framework-independent types compatible with Express request handlers. */
export interface ExpressRequestLike {
  role?: string;
  readonly headers?: Readonly<Record<string, unknown>>;
  readonly body?: unknown;
  readonly params?: unknown;
  readonly query?: unknown;
}

export interface ExpressResponseLike {
  status(code: number): this;
  send(payload: string): unknown;
}

export type ExpressNextFunction = (err?: unknown) => void;

export type ExpressOptions<
  P = unknown,
  Request extends ExpressRequestLike = ExpressRequestLike,
  Response extends ExpressResponseLike = ExpressResponseLike
> = BaseMiddlewareOptions<P, Request, Response, ExpressNextFunction>;

export const createExpressMiddleware =
  <P, Request extends ExpressRequestLike = ExpressRequestLike, Response extends ExpressResponseLike = ExpressResponseLike>(rbac: RBACInstance<P>) =>
  (operation: string | RegExp, options: ExpressOptions<P, Request, Response> = {}) =>
  async (req: Request, res: Response, next: ExpressNextFunction): Promise<void> => {
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

export default createExpressMiddleware;
