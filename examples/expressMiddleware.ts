import express from 'express';
import { createRBAC } from '@rbac/core';
import { createExpressMiddleware } from '@rbac/express';
import type { Roles } from '@rbac/core';
import { USER, PRODUCTS_FIND } from './constants';

const roles: Roles = {
  [USER]: { can: [PRODUCTS_FIND] }
};

const RBAC = createRBAC({ roles });
const canFindProducts = createExpressMiddleware(RBAC)(PRODUCTS_FIND);

async function run(): Promise<void> {
  const app = express();
  app.get('/products', canFindProducts, (_req, res) => {
    res.send('ok');
  });

  app.listen(3000, () => {
    console.log('Server running on port 3000');
  });
}

run().catch(console.error);
