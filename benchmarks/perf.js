const { suite, add, save, cycle, complete } = require('benny');
const asciichart = require('asciichart');
const RBAC = require('../lib').default;
const { readFileSync } = require('fs');

// Import other RBAC libraries
const AccessControl = require('accesscontrol');
const PopularRBAC = require('rbac').RBAC;
const EasyRBAC = require('easy-rbac');
const FastRBAC = require('fast-rbac').RBAC;

const CONDITIONAL_OPS = {
  callback: 'products:audit:callback',
  async: 'products:audit:async',
  promise: 'products:audit:promise'
};

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
  },
  auditor: {
    can: [
      {
        name: CONDITIONAL_OPS.callback,
        when: (_params, done) => setImmediate(() => done(null, true))
      },
      {
        name: CONDITIONAL_OPS.async,
        when: async () => true
      },
      {
        name: CONDITIONAL_OPS.promise,
        when: Promise.resolve(true)
      }
    ]
  }
};

const DEFAULT_LARGE_RESOURCE_COUNT = 200;

function createRange(count, mapFn) {
  return Array.from({ length: count }, (_, index) => mapFn(index));
}

function uniqueStrings(values) {
  return Array.from(new Set(values));
}

function sanitizeRolesForEasyRBAC(baseRoles) {
  return Object.entries(baseRoles).reduce((acc, [roleName, role]) => {
    const sanitized = {
      can: role.can.map(permission => {
        if (typeof permission === 'string') {
          return permission;
        }

        const normalized = { name: permission.name };
        const whenValue = permission.when;

        if (typeof whenValue === 'function') {
          normalized.when = whenValue;
        } else if (whenValue && typeof whenValue.then === 'function') {
          const cachedPromise = whenValue;
          normalized.when = () => cachedPromise;
        } else {
          normalized.when = () => Boolean(whenValue);
        }

        return normalized;
      })
    };

    if (role.inherits) {
      sanitized.inherits = [...role.inherits];
    }

    acc[roleName] = sanitized;
    return acc;
  }, {});
}

function createLargeDataset(resourceCount = DEFAULT_LARGE_RESOURCE_COUNT) {
  const resources = createRange(resourceCount, index => `resource${index}`);
  const readOps = resources.map(resource => `${resource}:read`);
  const writeOps = resources.map(resource => `${resource}:write`);
  const deleteOps = resources.map(resource => `${resource}:delete`);
  const globOps = resources.map(resource => `${resource}:*`);

  const callbackConditional = `${resources[0]}:audit:callback`;
  const asyncConditional = `${resources[0]}:audit:async`;
  const promiseConditional = `${resources[0]}:audit:promise`;

  const rbacRoles = {
    analyst: {
      can: readOps
    },
    manager: {
      can: uniqueStrings([...readOps, ...writeOps]),
      inherits: ['analyst']
    },
    director: {
      can: uniqueStrings([...readOps, ...writeOps, ...deleteOps]),
      inherits: ['manager']
    },
    superadmin: {
      can: globOps,
      inherits: ['director']
    },
    auditor: {
      can: [
        {
          name: callbackConditional,
          when: (_params, done) => setImmediate(() => done(null, true))
        },
        {
          name: asyncConditional,
          when: async () => true
        },
        {
          name: promiseConditional,
          when: Promise.resolve(true)
        }
      ]
    }
  };

  const fastRoles = {
    analyst: {
      can: readOps
    },
    manager: {
      can: uniqueStrings([...readOps, ...writeOps]),
      inherits: ['analyst']
    },
    director: {
      can: uniqueStrings([...readOps, ...writeOps, ...deleteOps]),
      inherits: ['manager']
    },
    superadmin: {
      can: globOps,
      inherits: ['director']
    }
  };

  const permissions = Object.fromEntries(
    resources.map(resource => [resource, ['read', 'write', 'delete']])
  );

  const buildGrants = actions =>
    uniqueStrings(
      resources.flatMap(resource =>
        actions.map(action => `${action}_${resource}`)
      )
    );

  const popularConfig = {
    roles: ['superadmin', 'director', 'manager', 'analyst'],
    permissions,
    grants: {
      analyst: buildGrants(['read']),
      manager: buildGrants(['read', 'write']),
      director: buildGrants(['read', 'write', 'delete']),
      superadmin: buildGrants(['read', 'write', 'delete'])
    }
  };

  return {
    resources,
    readOps,
    writeOps,
    deleteOps,
    globOps,
    rbacRoles,
    fastRoles,
    popularConfig,
    easyRoles: sanitizeRolesForEasyRBAC(rbacRoles),
    conditionalOps: {
      callback: callbackConditional,
      async: asyncConditional,
      promise: promiseConditional
    }
  };
}

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
  const rbac = new EasyRBAC(sanitizeRolesForEasyRBAC(roles));
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

function setupLargeAccessControl(dataset) {
  const ac = new AccessControl();

  const analystGrant = ac.grant('analyst');
  dataset.resources.forEach(resource => {
    analystGrant.readAny(resource);
  });

  const managerGrant = ac.grant('manager').extend('analyst');
  dataset.resources.forEach(resource => {
    managerGrant.updateAny(resource);
  });

  const directorGrant = ac.grant('director').extend('manager');
  dataset.resources.forEach(resource => {
    directorGrant.deleteAny(resource);
  });

  ac.grant('superadmin').extend('director');
  return ac;
}

function logResults(slug) {
  const data = JSON.parse(
    readFileSync(`benchmarks/results/${slug}.json`, 'utf8')
  );
  const ops = data.results.map(r => r.ops);
  console.log(`\n${data.name} ops/sec:`, ops.map(o => Math.round(o)).join(', '));
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
      details: result.details || {},
      samples: result.samples
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
      samples:
        stats.samples ?? stats.details?.sampleResults?.length ?? 'n/a'
    }));
    console.table(rows);
  });
}

async function main() {
  const rbac = RBAC({ enableLogger: false })(roles);
  const ac = setupAccessControl();
  const popularRBAC = setupPopularRBAC();
  const easyRBAC = setupEasyRBAC();
  const fastRBAC = setupFastRBAC();
  
  await popularRBAC.init();

  const mainSlug = 'rbac-comparison';
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
      file: mainSlug,
      version: '1.0.0',
      details: true,
      includeRawSamples: true
    }),
    save({
      folder: 'benchmarks/results',
      file: mainSlug,
      format: 'chart.html',
      details: true,
      includeRawSamples: true
    }),
    save({
      folder: 'benchmarks/results',
      file: mainSlug,
      format: 'csv',
      details: true,
      includeRawSamples: true
    })
  );

  logResults(mainSlug);

  const largeDataset = createLargeDataset();
  const largeSlug = 'rbac-comparison-large';

  const largeRBAC = RBAC({ enableLogger: false })(largeDataset.rbacRoles);
  const largeAccessControl = setupLargeAccessControl(largeDataset);
  const largePopularRBAC = new PopularRBAC(largeDataset.popularConfig);
  const largeEasyRBAC = new EasyRBAC(largeDataset.easyRoles);
  const largeFastRBAC = new FastRBAC({ roles: largeDataset.fastRoles });

  await largePopularRBAC.init();

  await suite(
    'RBAC Performance Comparison - Large Dataset',
    add('@rbac/rbac - large direct', async () => {
      await largeRBAC.can('analyst', `${largeDataset.resources[0]}:read`);
    }),
    add('@rbac/rbac - large inherited', async () => {
      await largeRBAC.can('director', `${largeDataset.resources[0]}:write`);
    }),
    add('@rbac/rbac - large glob', async () => {
      await largeRBAC.can('superadmin', `${largeDataset.resources[0]}:delete`);
    }),
    add('@rbac/rbac - large callback', async () => {
      await largeRBAC.can('auditor', largeDataset.conditionalOps.callback);
    }),
    add('@rbac/rbac - large async', async () => {
      await largeRBAC.can('auditor', largeDataset.conditionalOps.async);
    }),
    add('@rbac/rbac - large promise', async () => {
      await largeRBAC.can('auditor', largeDataset.conditionalOps.promise);
    }),
    add('AccessControl - large direct', async () => {
      await largeAccessControl.can('analyst').readAny(largeDataset.resources[0])
        .granted;
    }),
    add('AccessControl - large inherited', async () => {
      await largeAccessControl
        .can('director')
        .updateAny(largeDataset.resources[0]).granted;
    }),
    add('AccessControl - large admin', async () => {
      await largeAccessControl
        .can('superadmin')
        .deleteAny(largeDataset.resources[0]).granted;
    }),
    add('Popular RBAC - large direct', async () => {
      await largePopularRBAC.can('analyst', 'read', largeDataset.resources[0]);
    }),
    add('Popular RBAC - large inherited', async () => {
      await largePopularRBAC.can(
        'director',
        'write',
        largeDataset.resources[0]
      );
    }),
    add('Popular RBAC - large admin', async () => {
      await largePopularRBAC.can(
        'superadmin',
        'delete',
        largeDataset.resources[0]
      );
    }),
    add('Easy RBAC - large direct', async () => {
      await largeEasyRBAC.can('analyst', `${largeDataset.resources[0]}:read`);
    }),
    add('Easy RBAC - large inherited', async () => {
      await largeEasyRBAC.can('director', `${largeDataset.resources[0]}:write`);
    }),
    add('Easy RBAC - large glob', async () => {
      await largeEasyRBAC.can('superadmin', `${largeDataset.resources[0]}:delete`);
    }),
    add('Fast RBAC - large direct', async () => {
      await largeFastRBAC.can('analyst', largeDataset.resources[0], 'read');
    }),
    add('Fast RBAC - large inherited', async () => {
      await largeFastRBAC.can('director', largeDataset.resources[0], 'write');
    }),
    add('Fast RBAC - large glob', async () => {
      await largeFastRBAC.can('superadmin', largeDataset.resources[0], 'delete');
    }),
    cycle(),
    complete(),
    save({
      folder: 'benchmarks/results',
      file: largeSlug,
      version: '1.0.0',
      details: true,
      includeRawSamples: true
    }),
    save({
      folder: 'benchmarks/results',
      file: largeSlug,
      format: 'chart.html',
      details: true,
      includeRawSamples: true
    }),
    save({
      folder: 'benchmarks/results',
      file: largeSlug,
      format: 'csv',
      details: true,
      includeRawSamples: true
    })
  );

  logResults(largeSlug);
}

main().catch(console.error);
