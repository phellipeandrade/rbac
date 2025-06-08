import express from 'express';
import rbac, { createExpressMiddleware } from '@rbac/rbac';
import type { Roles } from '@rbac/rbac';
import { USER, PRODUCTS_FIND } from './constants';

const roles: Roles = {
  [USER]: { can: [PRODUCTS_FIND] }
};

const RBAC = rbac()(roles);
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
