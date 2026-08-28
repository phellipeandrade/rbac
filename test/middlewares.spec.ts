/* global describe, it */
import { describe, expect, it, jest } from '@jest/globals';
import rbac, {
  createExpressMiddleware,
  createNestMiddleware,
  createFastifyMiddleware
} from '../src/index';

const RBAC = rbac({ enableLogger: false })({
  user: { can: ['products:find'] }
});

type MockResponse = {
  code?: number;
  body?: unknown;
  status: (code: number) => MockResponse;
  send: (body: unknown) => void;
};

function mockRes(): MockResponse {
  return {
    code: undefined,
    body: undefined,
    status(code: number) {
      this.code = code;
      return this;
    },
    send(body: unknown) {
      this.body = body;
    }
  };
}
interface MockExpressRequest {
  role: string;
}

interface MockNestContext {
  switchToHttp(): {
    getRequest(): MockExpressRequest;
    getResponse(): MockResponse;
    getNext(): (err?: unknown) => void;
  };
}

describe('Middlewares', () => {
  it('express middleware allows access', async () => {
    const middleware = createExpressMiddleware(RBAC)('products:find');
    const req: MockExpressRequest = { role: 'user' };
    const res = mockRes();
    let called = false;
    await middleware(req as never, res as never, () => {
      called = true;
    });
    expect(called).toBe(true);
  });

  it('express middleware denies access', async () => {
    const middleware = createExpressMiddleware(RBAC)('products:edit');
    const req: MockExpressRequest = { role: 'user' };
    const res = mockRes();
    let called = false;
    await middleware(req as never, res as never, () => {
      called = true;
    });
    expect(called).toBe(false);
    expect(res.code).toBe(403);
  });

  it('express middleware allows access with next callback', async () => {
    const middleware = createExpressMiddleware(RBAC)('products:find');
    const req: MockExpressRequest = { role: 'user' };
    const res = mockRes();
    const nextFn = jest.fn();
    await middleware(req as never, res as never, nextFn);
    expect(nextFn).toHaveBeenCalled();
  });

  it('express middleware denies access with next callback', async () => {
    const middleware = createExpressMiddleware(RBAC)('products:edit');
    const req: MockExpressRequest = { role: 'user' };
    const res = mockRes();
    const nextFn = jest.fn();
    await middleware(req as never, res as never, nextFn);
    expect(nextFn).not.toHaveBeenCalled();
  });

  it('nest middleware allows access', async () => {
    const middleware = createNestMiddleware(RBAC)('products:find');
    const res = mockRes();
    const nextFn = jest.fn();
    const context: MockNestContext & { role: string } = {
      role: 'user',
      switchToHttp() {
        return {
          getRequest: () => ({ role: 'user' }),
          getResponse: () => res,
          getNext: () => nextFn
        };
      }
    } as any;
    await middleware(context as never, res as never, nextFn);
    // The middleware calls next() directly when access is allowed
    expect(nextFn).toHaveBeenCalled();
    expect(res.code).toBeUndefined();
  });

  it('nest middleware denies access', async () => {
    const middleware = createNestMiddleware(RBAC)('products:edit');
    const res = mockRes();
    const nextFn = jest.fn();
    const context: MockNestContext = {
      switchToHttp() {
        return {
          getRequest: () => ({ role: 'user' }),
          getResponse: () => res,
          getNext: () => nextFn
        };
      }
    };
    await middleware(context as never, res as never, nextFn as never);
    expect(nextFn).not.toHaveBeenCalled();
    expect(res.code).toBe(403);
  });

  it('fastify middleware allows access', async () => {
    const middleware = createFastifyMiddleware(RBAC)('products:find');
    const req: MockExpressRequest = { role: 'user' };
    const reply = mockRes();
    await middleware(req as never, reply as never);
    expect(reply.code).toBeUndefined();
  });

  it('fastify middleware denies access', async () => {
    const middleware = createFastifyMiddleware(RBAC)('products:edit');
    const req: MockExpressRequest = { role: 'user' };
    const reply = mockRes();
    await middleware(req as never, reply as never);
    expect(reply.code).toBe(403);
  });

  it('handles missing role in request', async () => {
    const middleware = createExpressMiddleware(RBAC)('products:find');
    const req = {} as MockExpressRequest;
    const res = mockRes();
    let called = false;
    await middleware(req as never, res as never, () => {
      called = true;
    });
    expect(called).toBe(false);
    expect(res.code).toBe(403);
  });

  it('handles undefined role in request', async () => {
    const middleware = createExpressMiddleware(RBAC)('products:find');
    const req = { role: undefined } as unknown as MockExpressRequest;
    const res = mockRes();
    let called = false;
    await middleware(req as never, res as never, () => {
      called = true;
    });
    expect(called).toBe(false);
    expect(res.code).toBe(403);
  });

  it('express middleware uses custom role and params extractors', async () => {
    const conditionalRbac = rbac<{ owner: boolean }>({ enableLogger: false })({
      user: { can: [{ name: 'products:update', when: (params: { owner: boolean }) => params.owner }] }
    });
    const middleware = createExpressMiddleware(conditionalRbac)('products:update', {
      getRole: req => (req as any).account.role,
      getParams: req => ({ owner: (req as any).account.owner })
    });
    const res = mockRes();
    const next = jest.fn();

    await middleware({ account: { role: 'user', owner: true } } as never, res as never, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('express middleware delegates denials and errors to configured handlers', async () => {
    const onDenied = jest.fn();
    const denied = createExpressMiddleware(RBAC)('products:edit', { onDenied });
    const res = mockRes();
    const next = jest.fn();
    await denied({ role: 'user' } as never, res as never, next);
    expect(onDenied).toHaveBeenCalledWith(expect.anything(), res, next);

    const error = new Error('role lookup failed');
    const failing = createExpressMiddleware(RBAC)('products:find', {
      getRole: () => { throw error; }
    });
    await failing({ role: 'user' } as never, mockRes() as never, next);
    expect(next).toHaveBeenCalledWith(error);
  });

  it('fastify middleware uses custom extractors and denial handler', async () => {
    const onDenied = jest.fn();
    const middleware = createFastifyMiddleware(RBAC)('products:edit', {
      getRole: req => req.account.role,
      getParams: req => ({ accountId: req.account.id }),
      onDenied
    });
    const req = { account: { role: 'user', id: '123' } };
    const reply = mockRes();

    await middleware(req, reply as never);

    expect(onDenied).toHaveBeenCalledWith(req, reply);
    expect(reply.code).toBeUndefined();
  });

  it('nest middleware uses custom extractors and delegates errors', async () => {
    const onDenied = jest.fn();
    const denied = createNestMiddleware(RBAC)('products:edit', {
      getRole: req => (req as any).account.role,
      getParams: req => ({ accountId: (req as any).account.id }),
      onDenied
    });
    const res = mockRes();
    const next = jest.fn();
    const req = { account: { role: 'user', id: '123' } };
    await denied(req as never, res as never, next);
    expect(onDenied).toHaveBeenCalledWith(req, res, next);

    const error = new Error('role lookup failed');
    const failing = createNestMiddleware(RBAC)('products:find', {
      getRole: () => { throw error; }
    });
    await failing(req as never, res as never, next);
    expect(next).toHaveBeenCalledWith(error);
  });
});
