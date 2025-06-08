/* global describe, it */
import chai from 'chai';
import rbac, {
  createExpressMiddleware,
  createNestMiddleware,
  createFastifyMiddleware
} from '../lib/index';

const expect = chai.expect;

const RBAC = rbac({ enableLogger: false })({
  user: { can: ['products:find'] }
});

function mockRes() {
  return {
    code: undefined,
    body: undefined,
    status(c) {
      this.code = c;
      return this;
    },
    send(b) {
      this.body = b;
    }
  };
}

describe('Middlewares', () => {
  it('express middleware allows access', async () => {
    const middleware = createExpressMiddleware(RBAC)('products:find');
    const req = { role: 'user' };
    const res = mockRes();
    let called = false;
    await middleware(req, res, () => {
      called = true;
    });
    expect(called).to.be.true;
  });

  it('express middleware denies access', async () => {
    const middleware = createExpressMiddleware(RBAC)('products:edit');
    const req = { role: 'user' };
    const res = mockRes();
    let called = false;
    await middleware(req, res, () => {
      called = true;
    });
    expect(called).to.be.false;
    expect(res.code).to.equal(403);
  });

  it('nest middleware behaves like express', async () => {
    const middleware = createNestMiddleware(RBAC)('products:edit');
    const req = { role: 'user' };
    const res = mockRes();
    let called = false;
    await middleware(req, res, () => {
      called = true;
    });
    expect(called).to.be.false;
    expect(res.code).to.equal(403);
  });

  it('fastify middleware denies access', async () => {
    const middleware = createFastifyMiddleware(RBAC)('products:edit');
    const req = { role: 'user' };
    const reply = mockRes();
    await middleware(req, reply);
    expect(reply.code).to.equal(403);
  });
});
