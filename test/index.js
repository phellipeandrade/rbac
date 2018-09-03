import rbac from '../src/index';

const belongsToAccount = (params, done) => done(null, params);

const PromisebelongsToAccount = new Promise((resolve) => {
  resolve(true);
});

const defaultRoles = {
  user: {
    can: ['products:find']
  },
  supervisor: {
    can: [{name: 'products:edit', when: PromisebelongsToAccount }],
    inherits: ['user']
  },
  admin: {
    can: [{name: 'products:delete', when: belongsToAccount }],
    inherits: ['supervisor']
  },
  superadmin: {
    can: ['products:find', 'products:edit', 'products:delete']
  },
  superhero: {
    can: [
      {name: 'drugs:find', when: PromisebelongsToAccount },
      'xablau:*',
      {name: 'products:*', when: belongsToAccount }
    ]
  }
};

const RBAC = rbac({ enableLogger: false })(defaultRoles);

RBAC.can('superhero', 'xablau:edit').then(result => console.log(result));
