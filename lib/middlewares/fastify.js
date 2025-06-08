"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFastifyMiddleware = void 0;
const createFastifyMiddleware = (rbac) => (operation, options = {}) => async (req, reply) => {
    const role = options.getRole ? options.getRole(req) : req.role;
    const params = options.getParams ? options.getParams(req) : undefined;
    const allowed = await rbac.can(role, operation, params);
    if (allowed)
        return;
    if (options.onDenied)
        return options.onDenied(req, reply);
    reply.status(403).send('Forbidden');
};
exports.createFastifyMiddleware = createFastifyMiddleware;
exports.default = exports.createFastifyMiddleware;
