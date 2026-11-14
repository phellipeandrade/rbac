import { rm } from 'node:fs/promises';
import { entries } from './package-manifest.mjs';
await Promise.all([
  rm('lib', { recursive: true, force: true }),
  ...entries.map(({name}) => rm(`packages/${name}/lib`, { recursive: true, force: true }))
]);
