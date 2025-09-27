const { suite, add, save, cycle, complete } = require('benny');
const asciichart = require('asciichart');
const RBAC = require('../lib').default;
const { readFileSync } = require('fs');

// Import other RBAC libraries
const AccessControl = require('accesscontrol');
const PopularRBAC = require('rbac').RBAC;
const EasyRBAC = require('easy-rbac');
const FastRBAC = require('fast-rbac').RBAC;

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

// Setup for different RBAC libraries
function setupAccessControl() {
  const ac = new AccessControl();
  
  ac.grant('user')
    .readOwn('products')
    .grant('supervisor')
    .extend('user')
    .updateOwn('products')
    .grant('superhero')
    .extend('supervisor')
    .deleteAny('products');
    
  return ac;
}

function setupPopularRBAC() {
  const rbac = new PopularRBAC({
    roles: ['superhero', 'supervisor', 'user'],
    permissions: {
      products: ['find', 'edit', 'delete']
    },
    grants: {
      user: ['find_products'],
      supervisor: ['find_products', 'edit_products'],
      superhero: ['find_products', 'edit_products', 'delete_products']
    }
  });
  return rbac;
}

function setupEasyRBAC() {
  const rbac = new EasyRBAC(roles);
  return rbac;
}

function setupFastRBAC() {
  const rbac = new FastRBAC({
    roles: {
      user: {
        can: ['products:find']
      },
      supervisor: {
        can: ['products:edit'],
        inherits: ['user']
      },
      superhero: {
        can: ['products:*']
      }
    }
  });
  return rbac;
}

async function main() {
  const rbac = RBAC({ enableLogger: false })(roles);
  const ac = setupAccessControl();
  const popularRBAC = setupPopularRBAC();
  const easyRBAC = setupEasyRBAC();
  const fastRBAC = setupFastRBAC();
  
  await popularRBAC.init();

  await suite(
    'RBAC Performance Comparison',
    add('@rbac/rbac - direct permission', async () => {
      await rbac.can('user', 'products:find');
    }),
    add('@rbac/rbac - inherited permission', async () => {
      await rbac.can('supervisor', 'products:find');
    }),
    add('@rbac/rbac - glob permission', async () => {
      await rbac.can('superhero', 'products:delete');
    }),
    add('AccessControl - direct permission', async () => {
      await ac.can('user').readOwn('products').granted;
    }),
    add('AccessControl - inherited permission', async () => {
      await ac.can('supervisor').readOwn('products').granted;
    }),
    add('AccessControl - admin permission', async () => {
      await ac.can('superhero').deleteAny('products').granted;
    }),
    add('Popular RBAC - direct permission', async () => {
      await popularRBAC.can('user', 'find', 'products');
    }),
    add('Popular RBAC - inherited permission', async () => {
      await popularRBAC.can('supervisor', 'find', 'products');
    }),
    add('Popular RBAC - admin permission', async () => {
      await popularRBAC.can('superhero', 'delete', 'products');
    }),
    add('Easy RBAC - direct permission', async () => {
      await easyRBAC.can('user', 'products:find');
    }),
    add('Easy RBAC - inherited permission', async () => {
      await easyRBAC.can('supervisor', 'products:find');
    }),
    add('Easy RBAC - glob permission', async () => {
      await easyRBAC.can('superhero', 'products:delete');
    }),
    add('Fast RBAC - direct permission', async () => {
      await fastRBAC.can('user', 'products', 'find');
    }),
    add('Fast RBAC - inherited permission', async () => {
      await fastRBAC.can('supervisor', 'products', 'find');
    }),
    add('Fast RBAC - glob permission', async () => {
      await fastRBAC.can('superhero', 'products', 'delete');
    }),
    cycle(),
    complete(),
    save({
      folder: 'benchmarks/results',
      file: 'rbac-comparison',
      version: '1.0.0',
      details: true,
      includeRawSamples: true
    }),
    save({
      folder: 'benchmarks/results',
      file: 'rbac-comparison',
      format: 'chart.html',
      details: true,
      includeRawSamples: true
    }),
    save({
      folder: 'benchmarks/results',
      file: 'rbac-comparison',
      format: 'csv',
      details: true,
      includeRawSamples: true
    })
  );

  const data = JSON.parse(
    readFileSync('benchmarks/results/rbac-comparison.json', 'utf8')
  );
  const ops = data.results.map(r => r.ops);
  console.log('\nBenchmark ops/sec:', ops.map(o => Math.round(o)).join(', '));
  console.log(asciichart.plot(ops, { height: 10 }));

  const grouped = data.results.reduce((acc, result) => {
    const [lib, category] = result.name.split(' - ');
    if (!acc[lib]) {
      acc[lib] = {};
    }
    acc[lib][category || 'overall'] = {
      ops: result.ops,
      margin: result.margin,
      percentSlower: result.percentSlower,
      details: result.details || {}
    };
    return acc;
  }, {});

  console.log('\nDetailed breakdown per library:');
  Object.entries(grouped).forEach(([lib, categories]) => {
    console.log(`\n${lib}`);
    const rows = Object.entries(categories).map(([category, stats]) => ({
      category,
      ops: Math.round(stats.ops),
      margin: `${stats.margin}%`,
      percentSlower: `${stats.percentSlower}%`,
      mean: stats.details.mean ? stats.details.mean.toExponential(3) : 'n/a',
      min: stats.details.min ? stats.details.min.toExponential(3) : 'n/a',
      max: stats.details.max ? stats.details.max.toExponential(3) : 'n/a',
      standardDeviation: stats.details.standardDeviation
        ? stats.details.standardDeviation.toExponential(3)
        : 'n/a',
      samples: stats.samples || stats.details?.sampleResults?.length || 'n/a'
    }));
    console.table(rows);
  });
}

main().catch(console.error);
