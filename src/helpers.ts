import type {
  When,
  WhenCallback,
  PatternPermission,
  NormalizedWhenFn,
  Role
} from './types';

const isRegex = (value: unknown): value is RegExp => value instanceof RegExp;

export const isGlob = (value: unknown): value is string =>
  typeof value === 'string' && value.includes('*');

// Color support detection cache
let colorSupportCache: boolean | null = null;

/**
 * Determines if the current environment supports ANSI color codes.
 * 
 * Detection logic (in priority order):
 * 1. If FORCE_COLOR is set to truthy value → return true
 * 2. If NO_COLOR is set to any value → return false
 * 3. If process.stdout.isTTY is false or undefined → return false
 * 4. If in known CI environment with color support → return true
 * 5. If process.stdout.isTTY is true → return true
 * 6. Default → return false
 * 
 * The result is cached to avoid repeated environment checks.
 */
export const supportsColor = (): boolean => {
  // Return cached result if available
  if (colorSupportCache !== null) {
    return colorSupportCache;
  }

  try {
    // Check FORCE_COLOR (highest priority)
    const forceColor = process.env.FORCE_COLOR;
    if (forceColor !== undefined && forceColor !== '' && forceColor !== '0' && forceColor !== 'false') {
      colorSupportCache = true;
      return true;
    }

    // Check NO_COLOR (second priority)
    const noColor = process.env.NO_COLOR;
    if (noColor !== undefined) {
      colorSupportCache = false;
      return false;
    }

    // Check if stdout is available and is a TTY
    if (!process.stdout || process.stdout.isTTY !== true) {
      colorSupportCache = false;
      return false;
    }

    // Check for known CI environments with color support
    const ci = process.env.CI;
    if (ci !== undefined) {
      const githubActions = process.env.GITHUB_ACTIONS;
      const gitlabCi = process.env.GITLAB_CI;
      const circleCi = process.env.CIRCLECI;
      
      if (githubActions || gitlabCi || circleCi) {
        colorSupportCache = true;
        return true;
      }
    }

    // If stdout is a TTY, support colors
    if (process.stdout.isTTY === true) {
      colorSupportCache = true;
      return true;
    }

    // Default to no color support
    colorSupportCache = false;
    return false;
  } catch (error) {
    // On any error, default to plain text output
    colorSupportCache = false;
    return false;
  }
};

/**
 * Conditionally applies ANSI color codes to text based on color support.
 * 
 * @param text - The text to potentially colorize
 * @param colorCode - The ANSI color code (e.g., "1;32" for bright green)
 * @param enabled - Whether color support is enabled
 * @returns Formatted text with ANSI codes when enabled, plain text otherwise
 */
export const colorize = (text: string, colorCode: string, enabled: boolean): string => {
  if (enabled) {
    return `\x1b[${colorCode}m${text}\x1b[0m`;
  }
  return text;
};

const globPatterns: Record<string, string> = {
  '*': '([^/]+)',
  '**': '(.+/)?([^/]+)',
  '**/': '(.+/)?'
};

const replaceGlobToRegex = (glob: string): string =>
  glob
    .replace(/\./g, '\\.')
    .replace(/\*\*$/g, '(.+)')
    .replace(/(?:\*\*\/|\*\*|\*)/g, str => globPatterns[str]);

const joinGlobs = (globs: string[]): string =>
  '(' + globs.map(replaceGlobToRegex).join('|') + ')';

export const underline = (): string =>
  '-'.repeat(Math.max((process.stdout.columns || 80) - 1, 1));

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

export const normalizeWhen = <P>(when: When<P> | true): NormalizedWhenFn<P> | true => {
  if (when === true) return true;
  if (when === false) return async () => false;
  if (typeof when === 'function') {
    if ((when as Function).length >= 2) {
      return async (params: P) =>
        new Promise<boolean>(resolve => {
          (when as WhenCallback<P>)(params, (err, result) => {
            if (err) return resolve(false);
            resolve(Boolean(result));
          });
        });
    }
    return async (params: P) => {
      try {
        return Boolean(await (when as any)(params));
      } catch {
        return false;
      }
    };
  }
  if (when instanceof Promise) {
    return async () => {
      try {
        return Boolean(await when);
      } catch {
        return false;
      }
    };
  }
  return async () => Boolean(when);
};

const regexCache = new Map<string, RegExp>();
const globCache = new Map<string, RegExp>();

export const regexFromOperation = (value: string | RegExp): RegExp | null => {
  if (isRegex(value)) return value;
  const cached = regexCache.get(value);
  if (cached) return cached;
  try {
    const flags = value.replace(/.*\/([gimsuy]*)$/, '$1');
    const pattern = value.replace(new RegExp('^/(.*?)/' + flags + '$'), '$1');
    const regex = new RegExp(pattern, flags);
    regexCache.set(value, regex);
    return regex;
  } catch (e) {
    return null;
  }
};

export const globToRegex = (glob: string | string[]): RegExp => {
  if (Array.isArray(glob)) return new RegExp('^' + joinGlobs(glob) + '$');
  const cached = globCache.get(glob);
  if (cached) return cached;
  const regex = new RegExp('^' + replaceGlobToRegex(glob) + '$');
  globCache.set(glob, regex);
  return regex;
};

export const hasMatchingOperation = (
  regex: RegExp,
  names: string[]
): boolean => {
  for (const name of names) {
    regex.lastIndex = 0;
    if (regex.test(name)) return true;
  }
  return false;
};

export const buildPermissionData = <P = unknown>(
  permissions: Role<P>['can']
): {
  direct: Set<string>;
  conditional: Map<string, NormalizedWhenFn<P>>;
  patterns: PatternPermission<P>[];
  all: string[];
} => {
  const direct = new Set<string>();
  const conditional = new Map<string, NormalizedWhenFn<P>>();
  const patterns: PatternPermission<P>[] = [];
  for (const p of permissions) {
    if (typeof p === 'string') {
      const regex = regexFromOperation(p);
      if (isGlob(p)) {
        patterns.push({ name: p, regex: globToRegex(p), when: true });
      } else if (regex) {
        patterns.push({ name: p, regex, when: true });
      } else {
        direct.add(p);
      }
    } else {
      const when = normalizeWhen(p.when);
      const regex = regexFromOperation(p.name);
      if (isGlob(p.name)) {
        patterns.push({ name: p.name, regex: globToRegex(p.name), when });
      } else if (regex) {
        patterns.push({ name: p.name, regex, when });
      } else if (when === true) {
        direct.add(p.name);
      } else {
        conditional.set(p.name, when);
      }
    }
  }
  const all = Array.from(direct).concat(
    Array.from(conditional.keys()),
    patterns.map(p => p.name)
  );
  return { direct, conditional, patterns, all };
};

export type { When, WhenCallback, PatternPermission } from './types';
