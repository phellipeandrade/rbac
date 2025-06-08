import type { RBACInstance } from '../types';

type FastifyRequest = any;
type FastifyReply = any;

export interface FastifyOptions<P = unknown> {
  getRole?: (req: FastifyRequest) => string;
  getParams?: (req: FastifyRequest) => P;
  onDenied?: (req: FastifyRequest, reply: FastifyReply) => void;
}

export const createFastifyMiddleware =
  <P>(rbac: RBACInstance<P>) =>
  (operation: string | RegExp, options: FastifyOptions<P> = {}) =>
  async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const role = options.getRole ? options.getRole(req) : (req as any).role;
    const params = options.getParams ? options.getParams(req) : undefined;
    const allowed = await rbac.can(role, operation, params as P);
    if (allowed) return;
    if (options.onDenied) return options.onDenied(req, reply);
    reply.status(403).send('Forbidden');
  };

export default createFastifyMiddleware;
