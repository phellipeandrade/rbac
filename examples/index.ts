import {
  USER,
  ADMIN,
  SUPERVISOR,
  SUPERADMIN,
  PRODUCTS_DELETE,
  PRODUCTS_EDIT,
  PRODUCTS_FIND
} from './constants';

import rbac from '@rbac/rbac';
import type { Roles } from '@rbac/rbac';

const defaultRoles: Roles = {
  [USER]: {
    can: [PRODUCTS_FIND]
  },
  [SUPERVISOR]: {
    can: [{ name: PRODUCTS_EDIT }],
    inherits: [USER]
  },
  [ADMIN]: {
    can: [{ name: PRODUCTS_DELETE }],
    inherits: [SUPERVISOR]
  },
  [SUPERADMIN]: {
    can: [PRODUCTS_FIND, PRODUCTS_EDIT, PRODUCTS_DELETE]
  }
};

const RBAC = rbac()(defaultRoles);

RBAC.can(USER, PRODUCTS_FIND);
RBAC.can(USER, PRODUCTS_EDIT);
