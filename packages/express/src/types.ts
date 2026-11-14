export interface BaseMiddlewareOptions<P, Request, Response, Next> {
  getRole?: (req: Request) => string;
  getParams?: (req: Request) => P;
  onDenied?: (req: Request, res: Response, next: Next) => void;
}
