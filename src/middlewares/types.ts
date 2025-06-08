import { Request, Response, NextFunction } from 'express';

export interface MiddlewareOptions<P = unknown> {
  getRole?: (req: Request) => string;
  getParams?: (req: Request) => P;
  onDenied?: (req: Request, res: Response, next: NextFunction) => void;
}
