import type { Role, Roles } from '@rbac/core';

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

// SQL parameters cannot bind identifiers. Reject non-identifiers before they
// reach a query and quote each allowed part for the selected dialect.
const identifier = /^[A-Za-z_][A-Za-z0-9_]*$/;

export const quoteSQLIdentifier = (
  value: string,
  dialect: 'mysql' | 'postgres',
  qualified = false
): string => {
  const parts = qualified ? value.split('.') : [value];
  if (parts.some(part => !identifier.test(part))) {
    throw new TypeError(`Invalid SQL identifier: ${JSON.stringify(value)}`);
  }
  const quote = dialect === 'mysql' ? '`' : '"';
  return parts.map(part => `${quote}${part}${quote}`).join('.');
};

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
  (typeof value === 'string' || Buffer.isBuffer(value)
    ? JSON.parse(String(value))
    : value) as Role<P>;
