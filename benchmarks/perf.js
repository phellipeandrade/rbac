const { suite, add, save, cycle, complete } = require('benny');
const asciichart = require('asciichart');
const RBAC = require('../lib').default;
const { readFileSync } = require('fs');

const roles = {
  user: {
    can: ['products:find']
  },
  supervisor: {
    can: [{ name: 'products:edit', when: () => true }],
    inherits: ['user']
  },
  superhero: {
    can: ['products:*']
  }
};

async function main() {
  const rbac = RBAC({ enableLogger: false })(roles);

  await suite(
    'RBAC can()',
    add('direct permission', async () => {
      await rbac.can('user', 'products:find');
    }),
    add('inherited permission', async () => {
      await rbac.can('supervisor', 'products:find');
    }),
    add('glob permission', async () => {
      await rbac.can('superhero', 'products:delete');
    }),
    cycle(),
    complete(),
    save({ file: 'can', version: '1.0.0' }),
    save({ file: 'can', format: 'chart.html' })
  );

  const data = JSON.parse(
    readFileSync('benchmark/results/can.json', 'utf8')
  );
  const ops = data.results.map(r => r.ops);
  console.log('\nBenchmark ops/sec:', ops.map(o => Math.round(o)).join(', '));
  console.log(asciichart.plot(ops, { height: 10 }));
  }

main();
