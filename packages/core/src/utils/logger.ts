import { supportsColor, colorize, underline } from './terminal-colors';
export { supportsColor, colorize, underline } from './terminal-colors';

export const defaultLogger = (
  role: string,
  operation: string | RegExp,
  result: boolean,
  colorsEnabled?: boolean
): void => {
  // Detect color support once at the start, or use provided value
  const useColors = colorsEnabled ?? supportsColor();

  // Apply colors conditionally based on detection
  const resultColor = result ? '1;32' : '1;31'; // green for true, red for false
  const fResult = colorize(String(result), resultColor, useColors);
  const fRole = colorize(String(role), '1;33', useColors); // yellow
  const fOperation = colorize(String(operation), '1;33', useColors); // yellow
  const rbacname = colorize('RBAC', '1;37', useColors); // white

  // Build the main message with blue base color
  const mainMessage = ` ${rbacname} ROLE: [${fRole}] OPERATION: [${fOperation}] PERMISSION: [${fResult}]`;
  const coloredMainMessage = useColors ? `\x1b[1;34m${mainMessage}\x1b[0m` : mainMessage;

  // Build underline with yellow color
  const underlineStr = underline();
  const coloredUnderline = useColors ? `\x1b[33m${underlineStr}\x1b[0m` : underlineStr;

  console.log('%s ', coloredUnderline);
  console.log('%s ', coloredMainMessage);
  console.log('%s ', coloredUnderline);
};
