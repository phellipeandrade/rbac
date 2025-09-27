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
});
