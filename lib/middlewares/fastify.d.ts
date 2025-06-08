import type { RBACInstance } from '../types';
type FastifyRequest = any;
type FastifyReply = any;
export interface FastifyOptions<P = unknown> {
    getRole?: (req: FastifyRequest) => string;
    getParams?: (req: FastifyRequest) => P;
    onDenied?: (req: FastifyRequest, reply: FastifyReply) => void;
}
export declare const createFastifyMiddleware: <P>(rbac: RBACInstance<P>) => (operation: string | RegExp, options?: FastifyOptions<P>) => (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
export default createFastifyMiddleware;
