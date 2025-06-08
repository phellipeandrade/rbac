import rbac from '@rbac/rbac';
import type { Roles } from '@rbac/rbac';
import {
  USER,
  PRODUCTS_FIND,
  PRODUCTS_UPDATE,
  PRODUCTS_CREATE
} from './constants';

const baseRoles: Roles = {
  [USER]: { can: [PRODUCTS_FIND] }
};

const RBAC = rbac()(baseRoles);

async function run(): Promise<void> {
  RBAC.addRole('editor', { can: [PRODUCTS_UPDATE], inherits: [USER] });
  await RBAC.can('editor', PRODUCTS_UPDATE); // true

  RBAC.updateRoles({
    [USER]: { can: [PRODUCTS_FIND, PRODUCTS_CREATE] }
  });
  await RBAC.can(USER, PRODUCTS_CREATE); // true
}

run().catch(console.error);
