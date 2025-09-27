import configuredRBAC from './configuredRBAC';
import roles from './roles';
import {
  ADMIN,
  PRODUCTS_DELETE,
  PRODUCTS_EDIT,
  PRODUCTS_FIND,
  SUPERADMIN,
  SUPERVISOR,
  USER
} from './constants';

const RBAC = configuredRBAC(roles);

async function run(): Promise<void> {
  await RBAC.can(USER, PRODUCTS_FIND);
  await RBAC.can(SUPERVISOR, PRODUCTS_EDIT, { registered: true });
  await RBAC.can(ADMIN, PRODUCTS_DELETE, { registered: true });
  await RBAC.can(SUPERADMIN, PRODUCTS_EDIT, { registered: true, isOwner: true });
}

run().catch(console.error);
