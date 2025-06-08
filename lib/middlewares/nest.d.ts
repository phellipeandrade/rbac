import type { RBACInstance } from '../types';
type Request = any;
type Response = any;
type NextFunction = (err?: unknown) => void;
export interface NestOptions<P = unknown> {
    getRole?: (req: Request) => string;
    getParams?: (req: Request) => P;
    onDenied?: (req: Request, res: Response, next: NextFunction) => void;
}
export declare const createNestMiddleware: <P>(rbac: RBACInstance<P>) => (operation: string | RegExp, options?: NestOptions<P>) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export default createNestMiddleware;
