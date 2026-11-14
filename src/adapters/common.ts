import type { Role, Roles } from '../types';

export interface AdapterColumns {
  name: string;
  role: string;
  tenantId: string;
}

export type AdapterColumnOptions = Partial<AdapterColumns>;

export const resolveColumns = (
  columns: AdapterColumnOptions | undefined,
  tenantColumn: string
): AdapterColumns => ({
  name: 'name',
  role: 'role',
  tenantId: tenantColumn,
  ...columns
});

export const resolveTenant = (tenantId?: string): string => tenantId ?? 'default';

export const rowsToRoles = <P>(
  rows: ReadonlyArray<Record<string, unknown>>,
  columns: AdapterColumns,
  deserialize: (value: unknown) => Role<P>
): Roles<P> => {
  const roles = Object.create(null) as Roles<P>;
  for (const row of rows) {
    roles[String(row[columns.name])] = deserialize(row[columns.role]);
  }
  return roles;
};

export const parseStoredRole = <P>(value: unknown): Role<P> =>
  (typeof value === 'string' ? JSON.parse(value) : value) as Role<P>;
