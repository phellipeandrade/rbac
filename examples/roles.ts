import type { Roles } from '@rbac/rbac';
import {
  ADMIN,
  PRODUCTS_DELETE,
  PRODUCTS_EDIT,
  PRODUCTS_FIND,
  SUPERADMIN,
  SUPERVISOR,
  USER
} from './constants';

export interface ProductContext {
  registered: boolean;
  isOwner?: boolean;
}

const roles: Roles<ProductContext> = {
  [USER]: {
    can: [PRODUCTS_FIND]
  },
  [SUPERVISOR]: {
    can: [
      {
        name: PRODUCTS_EDIT,
        when: ({ registered }) => registered
      }
    ],
    inherits: [USER]
  },
  [ADMIN]: {
    can: [
      {
        name: PRODUCTS_DELETE,
        when: ({ registered }) => registered
      }
    ],
    inherits: [SUPERVISOR]
  },
  [SUPERADMIN]: {
    can: [
      PRODUCTS_FIND,
      {
        name: PRODUCTS_EDIT,
        when: ({ isOwner }) => Boolean(isOwner)
      },
      PRODUCTS_DELETE
    ]
  }
};

export default roles;
