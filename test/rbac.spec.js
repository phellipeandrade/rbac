/* global describe, it, before */

import chai from 'chai';
import rbac from '../lib/@rbac/rbac';
import {
  USER,
  ADMIN,
  SUPERVISOR,
  SUPERADMIN,
  PRODUCTS_DELETE,
  PRODUCTS_EDIT,
  PRODUCTS_FIND
} from './constants';

chai.expect();

const expect = chai.expect;

const belongsToAccount = (params, done) => done(null, params);

const PromisebelongsToAccount = new Promise((resolve) => {
  resolve(true);
});

const defaultRoles = {
  [USER]: {
    can: [PRODUCTS_FIND]
  },
  [SUPERVISOR]: {
    can: [{name: PRODUCTS_EDIT, when: PromisebelongsToAccount }],
    inherits: [USER]
  },
  [ADMIN]: {
    can: [{name: PRODUCTS_DELETE, when: belongsToAccount }],
    inherits: [SUPERVISOR]
  },
  [SUPERADMIN]: {
    can: [PRODUCTS_FIND, PRODUCTS_EDIT, PRODUCTS_DELETE]
  }
};

describe('RBAC lib aspects', () => {
  it('RBAC config should be a function', () => {
    expect(rbac).to.be.a('function');
  });

  it('should return correct name', () => {
    expect(rbac.name).to.be.equal('RBAC');
  });

  it('should return a function', () => {
    expect(rbac()).to.be.a('function');
  });

  it('should return an object with a property named [can] when rbac function is called', () => {
    expect(rbac()(defaultRoles))
      .to.be.an('object')
      .and.to.have.a.property('can');
  });
});

describe('RBAC', () => {
  const RBAC = rbac()(defaultRoles);

  describe('user role', () => {
    it('[user] should have permission [products:find]', async () => {
      const result = await RBAC.can(USER, PRODUCTS_FIND);
      expect(result).to.be.true;
    });

    it('[user] should not have permission [wrong:operation]', async () => {
      const result = await RBAC.can(USER, 'wrong:operation');
      expect(result).to.be.false;
    });

    it('[user] should not have [supervisor] permissions [products:edit]', async () => {
      const result = await RBAC.can(USER, PRODUCTS_EDIT);
      expect(result).to.be.false;
    });

    it('[user] should not have admin permissions [products:delete]', async () => {
      const result = await RBAC.can(USER, PRODUCTS_DELETE);
      expect(result).to.be.false;
    });

    it('[user] should have permission when string regex is passed', async () => {
      const result = await RBAC.can(USER, '/prod/');
      expect(result).to.be.true;
    });

    it('[user] should have permission when regex is passed', async () => {
      const result = await RBAC.can(USER, /products/);
      expect(result).to.be.true;
    });
  });

  describe('supervisor role', () => {

    it('[supervisor] should have permission [products:edit]', async () => {
      const result = await RBAC.can(SUPERVISOR, PRODUCTS_EDIT);

      expect(result).to.be.true;
    });

    it('[supervisor] should have [user] inherited permission [products:find]', async () => {
      const result = await RBAC.can(SUPERVISOR, PRODUCTS_FIND);

      expect(result).to.be.true;
    });

    it('[supervisor] should not have admin permission [products:delete]', async () => {
      const result = await RBAC.can(SUPERVISOR, PRODUCTS_DELETE);

      expect(result).to.be.false;
    });

    it('[supervisor] should not have permission [wrong:operation]', async () => {
      const result = await RBAC.can(SUPERVISOR, 'wrong:operation');

      expect(result).to.be.false;
    });

  });

  describe('admin role', () => {

    it('[admin] should have permission [products:delete]', async () => {
      const result = await RBAC.can(ADMIN, PRODUCTS_DELETE, true);

      expect(result).to.be.true;
    });

    it('[admin] should not have permission if when returns falsy [products:delete]', async () => {
      const result = await RBAC.can(ADMIN, PRODUCTS_DELETE, false);

      expect(result).to.be.false;
    });

    it('[admin] should have [user] inherited permission [products:find]', async () => {
      const result = await RBAC.can(ADMIN, PRODUCTS_FIND);

      expect(result).to.be.true;
    });

    it('[admin] should have [supervisor] inherited permission [products:edit]', async () => {
      const result = await RBAC.can(ADMIN, PRODUCTS_EDIT);

      expect(result).to.be.true;
    });

    it('[admin] should not have permission [wrong:operation]', async () => {
      const result = await RBAC.can(ADMIN, 'wrong:operation');

      expect(result).to.be.false;
    });

  });

  describe('superadmin role', () => {

    it('[superadmin] should have permission [products:find]', async () => {
      const result = await RBAC.can(SUPERADMIN, PRODUCTS_FIND);

      expect(result).to.be.true;
    });

    it('[superadmin] should have permission [products:edit]', async () => {
      const result = await RBAC.can(SUPERADMIN, PRODUCTS_EDIT);

      expect(result).to.be.true;
    });

    it('[superadmin] should have permission [products:delete]', async () => {
      const result = await RBAC.can(SUPERADMIN, PRODUCTS_DELETE);

      expect(result).to.be.true;
    });

    it('[superadmin] should not have permission [wrong:operation]', async () => {
      const result = await RBAC.can(SUPERADMIN, 'wrong:operation');

      expect(result).to.be.false;
    });

    it('[superadmin] should have permission when string regex is passed', async () => {
      const result = await RBAC.can(SUPERADMIN, '/products/gi');
      expect(result).to.be.true;
    });

    it('[superadmin] should have permission when regex is passed', async () => {
      const result = await RBAC.can(SUPERADMIN, /products/gi);
      expect(result).to.be.true;
    });

  });
});
