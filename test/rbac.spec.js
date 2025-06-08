/* global describe, it, before */

import chai from 'chai';
import rbac from '../lib/index';

chai.expect();

const expect = chai.expect;

const belongsToAccount = (params, done) => done(null, params);

const PromisebelongsToAccount = new Promise((resolve) => {
  resolve(true);
});

const defaultRoles = {
  user: {
    can: ['products:find']
  },
  supervisor: {
    can: [{name: 'products:edit', when: PromisebelongsToAccount }],
    inherits: ['user']
  },
  admin: {
    can: [{name: 'products:delete', when: belongsToAccount }],
    inherits: ['supervisor']
  },
  superadmin: {
    can: ['products:find', 'products:edit', 'products:delete']
  },
  superhero: {
    can: ['products:*']
  }
};

describe('RBAC lib aspects', () => {
  it('RBAC config should be a function', () => {
    expect(rbac).to.be.a('function');
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
  const RBAC = rbac({ enableLogger: false })(defaultRoles);

  describe('user role', () => {
    it('[user] should have permission [products:find]', async () => {
      const result = await RBAC.can('user', 'products:find');
      expect(result).to.be.true;
    });

    it('[user] should not have permission [wrong:operation]', async () => {
      const result = await RBAC.can('user', 'wrong:operation');
      expect(result).to.be.false;
    });

    it('[user] should not have [supervisor] permissions [products:edit]', async () => {
      const result = await RBAC.can('user', 'products:edit');
      expect(result).to.be.false;
    });

    it('[user] should not have admin permissions [products:delete]', async () => {
      const result = await RBAC.can('user', 'products:delete');
      expect(result).to.be.false;
    });

    it('[user] should have permission when string regex is passed', async () => {
      const result = await RBAC.can('user', '/prod/');
      expect(result).to.be.true;
    });

    it('[user] should have permission when regex is passed', async () => {
      const result = await RBAC.can('user', /products/);
      expect(result).to.be.true;
    });

    it('[user] should have permission when glob is passed', async () => {
      const result = await RBAC.can('user', 'products*');
      expect(result).to.be.true;
    });

    it('[user] should  not have permission when not allowed glob is passed', async () => {
      const result = await RBAC.can('user', 'products:del*');
      expect(result).to.be.false;
    });

  });

  describe('supervisor role', () => {

    it('[supervisor] should have permission [products:edit]', async () => {
      const result = await RBAC.can('supervisor', 'products:edit');

      expect(result).to.be.true;
    });

    it('[supervisor] should have [user] inherited permission [products:find]', async () => {
      const result = await RBAC.can('supervisor', 'products:find');

      expect(result).to.be.true;
    });

    it('[supervisor] should not have admin permission [products:delete]', async () => {
      const result = await RBAC.can('supervisor', 'products:delete');

      expect(result).to.be.false;
    });

    it('[supervisor] should not have permission [wrong:operation]', async () => {
      const result = await RBAC.can('supervisor', 'wrong:operation');

      expect(result).to.be.false;
    });

  });

  describe('admin role', () => {

    it('[admin] should have permission [products:delete]', async () => {
      const result = await RBAC.can('admin', 'products:delete', true);

      expect(result).to.be.true;
    });

    it('[admin] should not have permission if when returns falsy [products:delete]', async () => {
      const result = await RBAC.can('admin', 'products:delete', false);

      expect(result).to.be.false;
    });

    it('[admin] should have [user] inherited permission [products:find]', async () => {
      const result = await RBAC.can('admin', 'products:find');

      expect(result).to.be.true;
    });

    it('[admin] should have [supervisor] inherited permission [products:edit]', async () => {
      const result = await RBAC.can('admin', 'products:edit');

      expect(result).to.be.true;
    });

    it('[admin] should not have permission [wrong:operation]', async () => {
      const result = await RBAC.can('admin', 'wrong:operation');

      expect(result).to.be.false;
    });

  });

  describe('superadmin role', () => {

    it('[superadmin] should have permission [products:find]', async () => {
      const result = await RBAC.can('superadmin', 'products:find');

      expect(result).to.be.true;
    });

    it('[superadmin] should have permission [products:edit]', async () => {
      const result = await RBAC.can('superadmin', 'products:edit');

      expect(result).to.be.true;
    });

    it('[superadmin] should have permission [products:delete]', async () => {
      const result = await RBAC.can('superadmin', 'products:delete');

      expect(result).to.be.true;
    });

    it('[superadmin] should not have permission [wrong:operation]', async () => {
      const result = await RBAC.can('superadmin', 'wrong:operation');

      expect(result).to.be.false;
    });

    it('[superadmin] should have permission when string regex is passed', async () => {
      const result = await RBAC.can('superadmin', '/products/gi');
      expect(result).to.be.true;
    });

    it('[superadmin] should have permission when regex is passed', async () => {
      const result = await RBAC.can('superadmin', /products/gi);
      expect(result).to.be.true;
    });

    it('[superadmin] should have permission when glob is passed', async () => {
      const result = await RBAC.can('superadmin', 'products*');
      expect(result).to.be.true;
    });

    it('[superadmin] should have not permission when wrong glob is passed', async () => {
      const result = await RBAC.can('superadmin', 'wrong*');
      expect(result).to.be.false;
    });

  });

  describe('superhero role', () => {

    it('[superhero] should have permission [products:find]', async () => {
      const result = await RBAC.can('superhero', 'products:find');

      expect(result).to.be.true;
    });

    it('[superhero] should have permission [products:edit]', async () => {
      const result = await RBAC.can('superhero', 'products:edit');

      expect(result).to.be.true;
    });

    it('[superhero] should have permission [products:delete]', async () => {
      const result = await RBAC.can('superhero', 'products:delete');

      expect(result).to.be.true;
    });

    it('[superhero] should not have permission [wrong:operation]', async () => {
      const result = await RBAC.can('superhero', 'wrong:operation');

      expect(result).to.be.false;
    });

    it('[superhero] should have permission when string regex is passed', async () => {
      const result = await RBAC.can('superhero', '/products/gi');
      expect(result).to.be.true;
    });

    it('[superhero] should have permission when regex is passed', async () => {
      const result = await RBAC.can('superhero', /products/gi);
      expect(result).to.be.true;
    });

    it('[superhero] should have permission when glob is passed', async () => {
      const result = await RBAC.can('superhero', 'products*');
      expect(result).to.be.true;
    });

    it('[superhero] should have not permission when wrong glob is passed', async () => {
      const result = await RBAC.can('superhero', 'wrong*');
      expect(result).to.be.false;
    });
  });

  describe('runtime role updates', () => {
    it('should allow permissions for a role added at runtime', async () => {
      RBAC.addRole('editor', { can: ['products:update'], inherits: ['user'] });
      const resEdit = await RBAC.can('editor', 'products:update');
      const resFind = await RBAC.can('editor', 'products:find');
      expect(resEdit).to.be.true;
      expect(resFind).to.be.true;
    });

    it('should respect updated roles when using can', async () => {
      RBAC.updateRoles({
        user: { can: ['products:find', 'products:create'] }
      });
      const resCreate = await RBAC.can('user', 'products:create');
      expect(resCreate).to.be.true;
    });
  });
});
