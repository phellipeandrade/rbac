const { performance } = require('node:perf_hooks');
const { createRBAC } = require('@rbac/core');

// An isolated engine benchmark: no reporting IO, external library, or string
// construction is included in the timed permission checks.
const iterations = Number(process.env.RBAC_BENCH_ITERATIONS || 300_000);
const samples = Number(process.env.RBAC_BENCH_SAMPLES || 5);
const warmup = Number(process.env.RBAC_BENCH_WARMUP || 50_000);

if (![iterations, samples, warmup].every(Number.isSafeInteger) ||
    iterations <= 0 || samples <= 0 || warmup < 0) {
  throw new Error('Invalid RBAC_BENCH_ITERATIONS, RBAC_BENCH_SAMPLES or RBAC_BENCH_WARMUP');
}

const operations = Array.from({ length: 200 }, (_, i) => `resource${i}:read`);
const rbac = createRBAC({
  enableLogger: false,
  roles: {
    reader: { can: operations },
    manager: { can: ['reports:*'], inherits: ['reader'] },
    regex: { can: ['/^events:[0-9]+$/'] },
    conditional: {
      can: [
        { name: 'documents:view', when: ({ allow }) => allow },
        { name: 'documents:update', when: async ({ allow }) => allow }
      ]
    }
  }
});

const cases = [
  ['exact grant', () => rbac.can('reader', operations[0]), true],
  ['inherited grant', () => rbac.can('manager', operations[0]), true],
  ['simple glob grant', () => rbac.can('manager', 'reports:edit'), true],
  ['regex grant', () => rbac.can('regex', 'events:42'), true],
  ['conditional sync', () => rbac.can('conditional', 'documents:view', { allow: true }), true],
  ['conditional async', () => rbac.can('conditional', 'documents:update', { allow: true }), true],
  ['conditional deny', () => rbac.can('conditional', 'documents:view', { allow: false }), false],
  ['unmatched operation', () => rbac.can('reader', 'missing:read'), false],
  ['unknown role', () => rbac.can('missing', 'resource0:read'), false],
  ['regex query', () => rbac.can('reader', /^resource0:read$/), true]
];

async function measure(fn, expected) {
  for (let i = 0; i < warmup; i += 1) {
    if ((await fn()) !== expected) throw new Error('Wrong authorization result during warmup');
  }

  const measurements = [];
  for (let sample = 0; sample < samples; sample += 1) {
    let matches = 0;
    const started = performance.now();
    for (let i = 0; i < iterations; i += 1) {
      if ((await fn()) === expected) matches += 1;
    }
    const elapsed = performance.now() - started;
    if (matches !== iterations) throw new Error('Wrong authorization result during measurement');
    measurements.push((iterations * 1000) / elapsed);
  }

  measurements.sort((a, b) => a - b);
  return Math.round(measurements[Math.floor(measurements.length / 2)]);
}

async function main() {
  const results = {};
  for (const [name, fn, expected] of cases) {
    results[name] = await measure(fn, expected);
  }

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ node: process.version, iterations, samples, opsPerSecond: results }, null, 2));
  } else {
    console.log(`Node ${process.version}; ${iterations.toLocaleString()} operations/sample; ${samples} samples (median ops/s)`);
    console.table(Object.entries(results).map(([scenario, ops]) => ({ scenario, 'ops/s': ops.toLocaleString() })));
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
