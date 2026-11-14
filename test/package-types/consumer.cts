import { createRBAC } from '@rbac/core';
import type { RBACOptions, RBACEngine } from '@rbac/core';
import { createNestGuard } from '@rbac/nestjs';
import { callbackWhen } from '@rbac/core/helpers';
const options: RBACOptions<boolean> = {
  roles: {user: {can: [{name: 'read', when: callbackWhen<boolean>((p, done) => done(null, p))}]}}, enableLogger: false
};
const engine: RBACEngine<boolean> = createRBAC(options);
const guard = createNestGuard(engine)('read');
void guard;
