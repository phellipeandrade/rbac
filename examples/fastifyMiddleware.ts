import fastify from 'fastify';
import rbac, { createFastifyMiddleware } from '@rbac/rbac';
import type { Roles } from '@rbac/rbac';
import { USER, PRODUCTS_FIND } from './constants';

const roles: Roles = {
  [USER]: { can: [PRODUCTS_FIND] }
};

const RBAC = rbac()(roles);
const canFindProducts = createFastifyMiddleware(RBAC)(PRODUCTS_FIND);

async function run(): Promise<void> {
  const app = fastify();
  app.get('/products', { preHandler: canFindProducts }, async (_req, reply) => {
    return 'ok';
  });

  await app.listen({ port: 3000 });
}

run().catch(console.error);
