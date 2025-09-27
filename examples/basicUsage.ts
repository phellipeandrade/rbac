import configuredRBAC from './configuredRBAC';
import roles from './roles';
import {
  PRODUCTS_DELETE,
  PRODUCTS_EDIT,
  PRODUCTS_FIND,
  USER
} from './constants';

const RBAC = configuredRBAC(roles);

async function run(): Promise<void> {
  const guestUser = { role: USER, registered: false };
  const registeredUser = { role: USER, registered: true };

  const guestCanFind = await RBAC.can(guestUser.role, PRODUCTS_FIND, guestUser);
  const registeredCanFind = await RBAC.can(
    registeredUser.role,
    PRODUCTS_FIND,
    registeredUser
  );
  const registeredCanEdit = await RBAC.can(
    registeredUser.role,
    PRODUCTS_EDIT,
    registeredUser
  );
  const registeredCanDelete = await RBAC.can(
    registeredUser.role,
    PRODUCTS_DELETE,
    registeredUser
  );

  console.log('Guest can find products?', guestCanFind);
  console.log('Registered user can find products?', registeredCanFind);
  console.log('Registered user can edit products?', registeredCanEdit);
  console.log('Registered user can delete products?', registeredCanDelete);
}

run().catch(console.error);
