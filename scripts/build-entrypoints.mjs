import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { entries } from './package-manifest.mjs';

// ESM facades forward the same objects as CommonJS, avoiding dual instances.
for (const { name, names, types } of entries) {
  const dir = join('packages', name, 'lib');
  writeFileSync(join(dir, 'index.mjs'), [`import compiled from './index.js';`,
    ...names.map(n => `export const ${n} = compiled.${n};`)].join('\n') + '\n');
  for (const ext of ['mts', 'cts']) {
    writeFileSync(join(dir, `index.d.${ext}`), [
      `export { ${names.join(', ')} } from './index.js';`,
      ...(types.length ? [`export type { ${types.join(', ')} } from './index.js';`] : [])
    ].join('\n') + '\n');
  }
  if (name === 'core') {
    const helpers = ['supportsColor', 'colorize', 'underline', 'defaultLogger', 'isGlob',
      'regexFromOperation', 'globToRegex', 'hasMatchingOperation', 'normalizeWhen',
      'callbackWhen', 'buildPermissionData'];
    writeFileSync(join(dir, 'helpers.mjs'), [`import compiled from './helpers.js';`,
      ...helpers.map(n => `export const ${n} = compiled.${n};`)].join('\n') + '\n');
    for (const ext of ['mts', 'cts']) writeFileSync(join(dir, `helpers.d.${ext}`),
      `export { ${helpers.join(', ')} } from './helpers.js';\n`+
      `export type { When, WhenCallback, PatternPermission } from './helpers.js';\n`);
  }
}
