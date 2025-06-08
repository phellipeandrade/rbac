import type { RBACInstance } from '../types';
import { BaseMiddlewareOptions } from './types';
import { ExecutionContext } from '@nestjs/common';

type NestNextFunction = (err?: unknown) => void;

type NestResponse = {
  status: (code: number) => any;
  send: (data: string | object) => void;
};

export interface NestOptions<P = unknown> extends BaseMiddlewareOptions<P> {
  getRole?: (req: ExecutionContext) => string;
  getParams?: (req: ExecutionContext) => P;
  onDenied?: (req: ExecutionContext, res: NestResponse, next: NestNextFunction) => void;
}

export const createNestMiddleware =
  <P>(rbac: RBACInstance<P>) =>
  (operation: string | RegExp, options: NestOptions<P> = {}) =>
  async (req: ExecutionContext, res: NestResponse, next: NestNextFunction): Promise<void> => {
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
