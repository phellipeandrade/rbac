import RBAC = require('@rbac/rbac');

const engine = RBAC<boolean>({ enableLogger: false })({ user: { can: ['read'] } });
const middleware = RBAC.createNestGuard(engine)('read');
type Config = RBAC.RBACConfig;

void middleware;
void ({} as Config);
