/** Minimum structural interface for Nest's ExecutionContext in HTTP guards. */
export type NestExecutionContext = {
  switchToHttp(): {
    getRequest(): NestRequest;
  };
};

export type NestRequest = Record<string, unknown> & { role?: string };
export type NestNextFunction = (err?: unknown) => void;

export type NestResponse = {
  status: (code: number) => NestResponse;
  send: (data: string | object) => unknown;
};
