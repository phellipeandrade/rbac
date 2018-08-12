import {
  USER,
  ADMIN,
  SUPERVISOR,
  SUPERADMIN,
  PRODUCTS_DELETE,
  PRODUCTS_EDIT,
  PRODUCTS_FIND
} from '../test/constants';

import rbac from '../src/rbac';

const defaultRoles = {
  [USER]: {
    can: [PRODUCTS_FIND]
  },
  [SUPERVISOR]: {
    can: [{name: PRODUCTS_EDIT }],
    inherits: [USER]
  },
  [ADMIN]: {
    can: [{name: PRODUCTS_DELETE }],
    inherits: [SUPERVISOR]
  },
  [SUPERADMIN]: {
    can: [PRODUCTS_FIND, PRODUCTS_EDIT, PRODUCTS_DELETE]
  }
};

const RBAC = rbac()(defaultRoles);

RBAC.can(USER, PRODUCTS_FIND);
RBAC.can(USER, PRODUCTS_EDIT);
