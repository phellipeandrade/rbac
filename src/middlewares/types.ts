export interface MiddlewareOptions<P = unknown> {
  getRole?: (req: any) => string;
  getParams?: (req: any) => P;
  onDenied?: (req: any, res: any, next: (err?: unknown) => void) => void;
}
