import RBAC from '@rbac/rbac';

console.log('Type of RBAC:', typeof RBAC);
console.log('RBAC value:', RBAC);
console.log('RBAC keys:', Object.keys(RBAC || {}));
console.log('Has .default?', RBAC?.default !== undefined);
console.log('Type of RBAC.default:', typeof RBAC?.default);
