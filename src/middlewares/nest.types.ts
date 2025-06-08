export type NestExecutionContext = {
  switchToHttp(): {
    getRequest(): Record<string, unknown>;
    getResponse(): Record<string, unknown>;
    getNext(): (err?: unknown) => void;
  };
};

export type NestNextFunction = (err?: unknown) => void;

export type NestResponse = {
  status: (code: number) => any;
  send: (data: string | object) => void;
};
