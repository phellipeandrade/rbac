import RBAC, { createExpressMiddleware, createFastifyMiddleware, createNestGuard } from '@rbac/rbac';
import type { Roles } from '@rbac/rbac';
import { callbackWhen } from '@rbac/rbac/helpers';
import { rolesSchema } from '@rbac/rbac/schemas';
import type { Request, Response, NextFunction } from 'express';
import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify';

const roles: Roles<boolean> = {
  user: { can: [{ name: 'read', when: callbackWhen<boolean>((p, done) => done(null, p)) }] }
};
const engine = RBAC<boolean>({ enableLogger: false })(roles);

const expressHandler: (req: Request, res: Response, next: NextFunction) => Promise<void> =
  createExpressMiddleware(engine)('read');
const fastifyHandler: preHandlerHookHandler = createFastifyMiddleware(engine)('read');

const nativeFastifyHandler = createFastifyMiddleware<boolean, FastifyRequest, FastifyReply>(engine)(
  'read',
  { getRole: req => String(req.headers['x-role'] ?? ''), getParams: () => true }
);
const guard = createNestGuard(engine)('read');

void expressHandler;
void fastifyHandler;
void nativeFastifyHandler;
void guard;
void rolesSchema;
