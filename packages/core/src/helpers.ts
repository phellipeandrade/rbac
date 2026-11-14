export { supportsColor, colorize, underline, defaultLogger } from './utils/logger';
export { isGlob, regexFromOperation, globToRegex, hasMatchingOperation } from './utils/patterns';
export { normalizeWhen, callbackWhen } from './utils/when';
export { buildPermissionData } from './core/permission-data';
export type { When, WhenCallback, PatternPermission } from './types';
