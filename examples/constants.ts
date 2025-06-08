export const USER = 'user' as const;
export const SUPERVISOR = 'supervisor' as const;
export const SUPERVISORWITHOUTPERMISSION = 'supervisor_without_permissions' as const;
export const ADMIN = 'admin' as const;
export const SUPERADMIN = 'superadmin' as const;
export const PRODUCTS_FIND = 'products:find' as const;
export const PRODUCTS_EDIT = 'products:edit' as const;
export const PRODUCTS_DELETE = 'products:delete' as const;

export type RoleName =
  | typeof USER
  | typeof SUPERVISOR
  | typeof SUPERVISORWITHOUTPERMISSION
  | typeof ADMIN
  | typeof SUPERADMIN;

export type Operation =
  | typeof PRODUCTS_FIND
  | typeof PRODUCTS_EDIT
  | typeof PRODUCTS_DELETE;
