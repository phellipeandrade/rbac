const { performance } = require('node:perf_hooks');
const RBAC = require('../lib').default;

const RESOURCE_COUNT = 200;
const ITERATIONS = 5_000_000;
const resources = Array.from({ length: RESOURCE_COUNT }, (_, i) => `resource${i}`);
const permissions = resources.map(resource => `${resource}:read`);
const rbac = RBAC({ enableLogger: false })({ analyst: { can: permissions } });
const stableOperation = permissions[0];
const directSet = new Set(permissions);

async function measure(name, fn) {
  // Warmup prevents tier-up work from contaminating the timed loop.
  for (let i = 0; i < 100_000; i += 1) await fn();
  const started = performance.now();
  for (let i = 0; i < ITERATIONS; i += 1) await fn();
  const elapsed = performance.now() - started;
  console.log(`${name}: ${Math.round((ITERATIONS * 1000) / elapsed).toLocaleString()} ops/s`);
}

async function main() {
  await measure('RBAC exact, stable operation string', () => rbac.can('analyst', stableOperation));
  await measure('RBAC exact, interpolated operation string', () => rbac.can('analyst', `${resources[0]}:read`));
  await measure('Set.has, stable operation string', () => directSet.has(stableOperation));
  await measure('Set.has, interpolated operation string', () => directSet.has(`${resources[0]}:read`));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
