import rbac from '@rbac/rbac';

const rbacConfig = {
  enableLogger: false
};

const configuredRBAC = rbac(rbacConfig);

export default configuredRBAC;
