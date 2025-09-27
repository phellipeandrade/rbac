
   import { describe, expect, it, jest } from '@jest/globals';
   import RBAC, { createTenantRBAC } from '../src/index';
   import rawRBAC from '../src/rbac';
   import type { RoleAdapter } from '../src/adapters/adapter';
   import type { Roles } from '../src/types';
   
   const createAdapter = <P>(roles: Roles<P>) => {
     const getRoles = jest.fn(async (_tenantId?: string) => roles);
     const addRole = jest.fn(async () => undefined);
     const updateRoles = jest.fn(async () => undefined);
   
     const adapter: RoleAdapter<P> = {
       getRoles,
       addRole,
       updateRoles
     };
   
     return { adapter, getRoles, addRole, updateRoles };
   };
   
   describe('package entry point', () => {
     it('should re-export the RBAC factory as default export', () => {
       expect(RBAC).toBe(rawRBAC);
     });
   
     it('createTenantRBAC should load tenant roles and return an RBAC instance', async () => {
       const roles: Roles = {
         user: { can: ['document:read'] }
       };
       const { adapter, getRoles } = createAdapter(roles);
   
       const rbac = await createTenantRBAC(adapter, 'tenant-1');
   
       expect(getRoles).toHaveBeenCalledWith('tenant-1');
       await expect(rbac.can('user', 'document:read')).resolves.toBe(true);
       await expect(rbac.can('user', 'document:write')).resolves.toBe(false);
     });
   
     it('createTenantRBAC should forward configuration options to the RBAC factory', async () => {
       const roles: Roles = {
         user: { can: ['file:download'] }
       };
       const { adapter } = createAdapter(roles);
       const logger = jest.fn();
   
       const rbacWithLogger = await createTenantRBAC(adapter, 'tenant-logs', {
         logger,
         enableLogger: true
       });
       await rbacWithLogger.can('user', 'file:download');
       expect(logger).toHaveBeenCalledWith('user', 'file:download', true);
   
       const silentLogger = jest.fn();
       const { adapter: silentAdapter } = createAdapter(roles);
       const silentRbac = await createTenantRBAC(silentAdapter, 'tenant-silent', {
         logger: silentLogger,
         enableLogger: false
       });
       await silentRbac.can('user', 'file:download');
       expect(silentLogger).not.toHaveBeenCalled();
     });
   });