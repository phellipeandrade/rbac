import rbac, {
  createExpressMiddleware,
  createNestMiddleware,
  createFastifyMiddleware
} from '../src/index';

const RBAC = rbac({ enableLogger: false })({
  user: { can: ['products:find'] }
});

function mockRes() {
  const mockResponse = {
    code: undefined as number | undefined,
    body: undefined as any,
    status(c: number) {
      this.code = c;
      return this;
    },
    send(b: any) {
      this.body = b;
    },
    // Adicionar métodos mínimos necessários para Express Response
    sendStatus: jest.fn(),
    links: jest.fn(),
    json: jest.fn(),
    jsonp: jest.fn(),
    sendFile: jest.fn(),
    sendfile: jest.fn(),
    download: jest.fn(),
    contentType: jest.fn(),
    type: jest.fn(),
    format: jest.fn(),
    attachment: jest.fn(),
    header: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
    clearCookie: jest.fn(),
    cookie: jest.fn(),
    location: jest.fn(),
    redirect: jest.fn(),
    render: jest.fn(),
    locals: {},
    charset: '',
    app: {} as any,
    req: {} as any,
    res: {} as any
  };
  return mockResponse as any;
}

function mockReq(role: string) {
  return {
    role,
    get: () => undefined,
    header: () => undefined,
    accepts: () => undefined,
    acceptsCharsets: () => undefined,
    acceptsEncodings: () => undefined,
    acceptsLanguages: () => undefined,
    range: () => undefined,
    param: () => undefined,
    is: () => undefined,
    protocol: 'http',
    secure: false,
    ip: '127.0.0.1',
    ips: [],
    subdomains: [],
    path: '/',
    hostname: 'localhost',
    fresh: false,
    stale: false,
    xhr: false,
    method: 'GET',
    url: '/',
    originalUrl: '/',
    baseUrl: '',
    route: undefined,
    params: {},
    query: {},
    body: {},
    cookies: {},
    signedCookies: {},
    headers: {},
    res: undefined,
    app: undefined,
    next: undefined
  } as any;
}

function mockNestContext(role: string) {
  const req = mockReq(role);
  const res = mockRes();
  const next = jest.fn();
  
  return {
    switchToHttp() {
      return {
        getRequest: () => req,
        getResponse: () => res,
        getNext: () => next
      };
    }
  };
}

describe('Middlewares', () => {
  it('express middleware allows access', async () => {
    const middleware = createExpressMiddleware(RBAC)('products:find');
    const req = mockReq('user');
    const res = mockRes();
    let called = false;
    await middleware(req, res, () => {
      called = true;
    });
    expect(called).toBe(true);
  });

  it('express middleware denies access', async () => {
    const middleware = createExpressMiddleware(RBAC)('products:edit');
    const req = mockReq('user');
    const res = mockRes();
    let called = false;
    await middleware(req, res, () => {
      called = true;
    });
    expect(called).toBe(false);
    expect(res.code).toBe(403);
  });

  it('nest middleware behaves like express', async () => {
    const middleware = createNestMiddleware(RBAC)('products:edit');
    const context = mockNestContext('user');
    const res = mockRes();
    const next = jest.fn();
    await middleware(context, res, next);
    expect(res.code).toBe(403);
  });

  it('fastify middleware denies access', async () => {
    const middleware = createFastifyMiddleware(RBAC)('products:edit');
    const req = mockReq('user');
    const reply = mockRes();
    await middleware(req, reply);
    expect(reply.code).toBe(403);
  });
});
