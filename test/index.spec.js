/* global describe, it, before */

import chai from 'chai';
import rbac from '../src';

chai.expect();

const expect = chai.expect;

describe('Given an instance of my Cat library', () => {
  describe('when I need the name', () => {
    it('should return the name', async () => {
      const RBAC = rbac({
        user: { can: ['products:find'] }
      });

      const result = await RBAC.can('user', 'products:find');

      expect(rbac.name).to.be.equal('RBAC');
      expect(result).to.be.true;
    });
  });
});
