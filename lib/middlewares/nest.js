"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNestMiddleware = void 0;
const createNestMiddleware = (rbac) => (operation, options = {}) => async (req, res, next) => {
    try {
        const role = options.getRole ? options.getRole(req) : req.role;
        const params = options.getParams ? options.getParams(req) : undefined;
        const allowed = await rbac.can(role, operation, params);
        if (allowed)
            return next();
        if (options.onDenied)
            return options.onDenied(req, res, next);
        res.status(403).send('Forbidden');
    }
    catch (err) {
        next(err);
    }
};
exports.createNestMiddleware = createNestMiddleware;
exports.default = exports.createNestMiddleware;
