import { existsSync } from 'node:fs';
import { join } from 'node:path';

if (!existsSync(join(process.cwd(), 'lib/index.mjs'))) {
  console.error('Package not built. Run npm run build from the repository root first.');
  process.exitCode = 1;
}
