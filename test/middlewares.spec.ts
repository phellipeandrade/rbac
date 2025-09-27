/* global describe, it */
import { describe, expect, it } from '@jest/globals';
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

  it('nest middleware behaves like express', async () => {
    const middleware = createNestMiddleware(RBAC)('products:edit');
    const res = mockRes();
    let called = false;
    const context: MockNestContext = {
      switchToHttp() {
        return {
          getRequest: () => ({ role: 'user' }),
          getResponse: () => res,
          getNext: () => () => {
            called = true;
          }
        };
      }
    };
    await middleware(context as never, () => {});
    expect(called).toBe(false);
    expect(res.code).toBe(403);
  });

  it('fastify middleware denies access', async () => {
    const middleware = createFastifyMiddleware(RBAC)('products:edit');
    const req: MockExpressRequest = { role: 'user' };
    const reply = mockRes();
    await middleware(req as never, reply as never);
    expect(reply.code).toBe(403);
  });
});
