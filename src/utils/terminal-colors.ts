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
  } catch {
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

export const underline = (): string =>
  '-'.repeat(Math.max((process.stdout.columns || 80) - 1, 1));
