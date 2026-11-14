import fastify from 'fastify';
import { createRBAC } from '@rbac/core';
import { createFastifyMiddleware } from '@rbac/fastify';
import type { Roles } from '@rbac/core';
import { USER, PRODUCTS_FIND } from './constants';

const roles: Roles = {
  [USER]: { can: [PRODUCTS_FIND] }
};

const RBAC = createRBAC({ roles });
const canFindProducts = createFastifyMiddleware(RBAC)(PRODUCTS_FIND);

async function run(): Promise<void> {
  const app = fastify();
  app.get('/products', { preHandler: canFindProducts }, async (_req, reply) => {
    return 'ok';
  });

  await app.listen({ port: 3000 });
}

run().catch(console.error);
