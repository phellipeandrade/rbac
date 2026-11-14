import {createRBAC} from '@rbac-engine';
import type {Roles} from '../../../packages/core/src/types';

export type Condition = 'always' | 'owner' | 'active';
export type Rule = {operation: string; condition: Condition};
export type VisualRole = {id: string; inherits: string[]; rules: Rule[]};
export type VisualUser = {id: string; name: string; roles: string[]};
export type Context = {userId: string; ownerId: string; isActive: boolean};
export type Scenario = {roles: VisualRole[]; users: VisualUser[]};

export const initialScenario: Scenario = {
  roles: [
    {id: 'viewer', inherits: [], rules: [{operation: 'documents:read', condition: 'always'}]},
    {id: 'editor', inherits: ['viewer'], rules: [{operation: 'documents:edit', condition: 'owner'}, {operation: 'documents:create', condition: 'active'}]},
    {id: 'admin', inherits: ['editor'], rules: [{operation: 'documents:*', condition: 'always'}]}
  ],
  users: [
    {id: 'u1', name: 'Alex', roles: ['viewer']},
    {id: 'u2', name: 'Sam', roles: ['editor']},
    {id: 'u3', name: 'Jordan', roles: ['admin']}
  ]
};

// This only translates visual conditions to the package's public `when` API.
// All actual permission decisions are made by packages/core/src/rbac.ts.
export function compileRoles(roles: VisualRole[]): Roles<Context> {
  const output: Roles<Context> = Object.create(null);
  for (const role of roles) {
    output[role.id] = {
      inherits: role.inherits,
      can: role.rules.map(rule => rule.condition === 'always'
        ? rule.operation
        : {
          name: rule.operation,
          when: (params: Context) => rule.condition === 'owner'
            ? params?.ownerId === params?.userId
            : params?.isActive === true
        }
      )
    };
  }
  return output;
}

export async function evaluate(roles: VisualRole[], requestedRoles: string[], operation: string, context: Context) {
  const rbac = createRBAC<Context>({roles: compileRoles(roles), enableLogger: false});
  for (const role of requestedRoles) {
    if (await rbac.can(role, operation, context)) return true;
  }
  return false;
}

export function referencedRules(roles: VisualRole[], requestedRoles: string[]) {
  const visited = new Set<string>();
  const rules: Array<{role: string; rule: Rule}> = [];
  const collect = (id: string) => {
    if (visited.has(id)) return;
    visited.add(id);
    const role = roles.find(item => item.id === id);
    if (!role) return;
    for (const parent of role.inherits) collect(parent);
    for (const rule of role.rules) rules.push({role: role.id, rule});
  };
  requestedRoles.forEach(collect);
  return rules;
}
