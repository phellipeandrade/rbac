import { z } from 'zod';
import type { Role, Roles, When } from '@rbac/core';

// Schema to validate the `when` property of a role operation
export const whenSchema: z.ZodType<When> = z.custom<When>(
  value => typeof value === 'boolean' || typeof value === 'function' || value instanceof Promise
);

// Schema for items in the `can` array
export const roleOperationSchema: z.ZodType<Role['can'][number]> = z.union([
  z.string(),
  z.object({
    name: z.string(),
    when: whenSchema,
  }),
]);

// Schema for a single role definition
export const roleSchema: z.ZodType<Role> = z.object({
  can: z.array(roleOperationSchema),
  inherits: z.array(z.string()).optional(),
});

// Schema for the object with all roles
export const rolesSchema: z.ZodType<Roles> = z.record(z.string(), roleSchema);
