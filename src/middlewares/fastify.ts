import type { RBACInstance } from '../types';

/** Structural Fastify contract; consumers can supply their own request/reply types. */
export interface FastifyRequestLike {
  role?: string;
  readonly headers?: Readonly<Record<string, unknown>>;
  readonly body?: unknown;
  readonly params?: unknown;
  readonly query?: unknown;
  readonly method?: string;
  readonly url?: string;
}

export interface FastifyReplyLike {
  status(code: number): this;
  send(payload: string): unknown;
}

export interface FastifyOptions<
  P = unknown,
  Request extends FastifyRequestLike = FastifyRequestLike,
  Reply extends FastifyReplyLike = FastifyReplyLike
> {
  getRole?: (req: Request) => string;
  getParams?: (req: Request) => P;
  onDenied?: (req: Request, reply: Reply) => void | Promise<void>;
}

export const createFastifyMiddleware =
  <P, Request extends FastifyRequestLike = FastifyRequestLike, Reply extends FastifyReplyLike = FastifyReplyLike>(rbac: RBACInstance<P>) =>
  (operation: string | RegExp, options: FastifyOptions<P, Request, Reply> = {}) =>
  async (req: Request, reply: Reply): Promise<void> => {
    const role = options.getRole ? options.getRole(req) : req.role;
    const params = options.getParams ? options.getParams(req) : undefined;
    const allowed = await rbac.can(role ?? '', operation, params);
    if (allowed) return;
    if (options.onDenied) return options.onDenied(req, reply);
    reply.status(403).send('Forbidden');
  };

export default createFastifyMiddleware;
