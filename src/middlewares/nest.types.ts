export interface NestHttpExecutionContext {
  switchToHttp(): {
    getRequest(): Record<string, unknown>;
    getResponse(): Record<string, unknown>;
    getNext(): (err?: unknown) => void;
  };
}

export interface NestExecutionContext extends Record<string, unknown> {
  switchToHttp(): {
    getRequest(): Record<string, unknown>;
    getResponse(): Record<string, unknown>;
    getNext(): (err?: unknown) => void;
  };
}

export type NestNextFunction = (err?: unknown) => void;

export type NestHttpResponse = Record<string, unknown> & {
  status: (code: number) => NestHttpResponse;
  send: (data: string | object) => void;
};

export interface NestOptions<P = unknown> {
  getRole?: (req: NestExecutionContext) => string;
  getParams?: (req: NestExecutionContext) => P;
  onDenied?: (req: NestExecutionContext, res: NestHttpResponse, next: NestNextFunction) => void;
}
