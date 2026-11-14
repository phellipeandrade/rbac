import { createRBAC } from '@rbac/core';
import type { Roles, RBACOptions, RBACEngine } from '@rbac/core';
import { createExpressMiddleware } from '@rbac/express';
import { createFastifyMiddleware } from '@rbac/fastify';
import { createNestGuard } from '@rbac/nestjs';
import { callbackWhen } from '@rbac/core/helpers';
import { rolesSchema } from '@rbac/schemas';
import { MongoRoleAdapter, createTenantRBAC } from '@rbac/adapters';
import type { Request, Response, NextFunction } from 'express';
import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify';
const roles: Roles<boolean> = {
  user: { can: [{ name: 'read', when: callbackWhen<boolean>((p, done) => done(null, p)) }] }
};
const options: RBACOptions<boolean> = { roles, enableLogger: false };
const engine: RBACEngine<boolean> = createRBAC(options);
const expressHandler: (req: Request, res: Response, next: NextFunction) => Promise<void> =
  createExpressMiddleware(engine)('read');
const fastifyHandler: preHandlerHookHandler = createFastifyMiddleware(engine)('read');
const nativeFastifyHandler = createFastifyMiddleware<boolean, FastifyRequest, FastifyReply>(engine)(
  'read', { getRole: req => String(req.headers['x-role'] ?? ''), getParams: () => true }
);
const guard = createNestGuard(engine)('read');
const inferred = createRBAC({ roles: { user: { can: [{name: 'view', when: (context: {owner: boolean}) => context.owner}] } } });
void inferred.can('user', 'view', {owner: true});
// @ts-expect-error Incorrect inferred context shape must be rejected.
void inferred.can('user', 'view', {owner: 'wrong'});
void (async () => createTenantRBAC(new MongoRoleAdapter<boolean>({uri: 'mongodb://localhost', dbName: 'rbac', collection: 'roles'}), 'tenant-a'));
void expressHandler; void fastifyHandler; void nativeFastifyHandler; void guard; void rolesSchema;
