import { isFunction, isPromise, defaultLogger } from './helpers';

const can = (config = {
  logger: defaultLogger,
  enableLogger: true
}) => (mappedRoles) => (role, operation, params) => {

  return new Promise((resolve, reject) => {

    const resolvePromise = (role, result) => {
      if (config.enableLogger) {
        config.logger(role, operation, result);
      }
      return resolve(result);
    };

    if (typeof role !== 'string') {
      throw new TypeError('Expected first parameter to be string : role');
    }

    if (typeof operation !== 'string') {
      throw new TypeError('Expected second parameter to be string : operation');
    }

    const FoundedRole = mappedRoles[role];

    if (!FoundedRole) {
      throw new Error('Undefined role');
    }

    if (isPromise(FoundedRole.can[operation])) {
      return FoundedRole.can[operation]
        .then(result => {
          if (!result) {
            if (FoundedRole.inherits) {
              return Promise
                .all(FoundedRole.inherits.map(parent =>
                  can({ enableLogger: false })(mappedRoles)(parent, operation, params)))
                .then(result => resolvePromise(role, result.indexOf(true) > -1))
                .catch(() => resolvePromise(role, false));
            }
            return resolvePromise(role, false);
          }
          return resolvePromise(role, Boolean(result));
        })
        .catch(() => resolvePromise(role, false));
    }

    if (isFunction(FoundedRole.can[operation])) {
      return FoundedRole.can[operation](params, (err, result) => {
        if (err) return reject(err);
        if (!result) {
          if (FoundedRole.inherits) {
            return Promise
              .all(FoundedRole.inherits.map(parent =>
                can({ enableLogger: false })(mappedRoles)(parent, operation, params)))
              .then(result => resolvePromise(role, result.indexOf(true) > -1))
              .catch(() => resolvePromise(role, false));
          }
          return resolvePromise(role, false);
        }
        return resolvePromise(role, true);
      });
    }

    if (!FoundedRole.can[operation]) {
      if (!FoundedRole.inherits) return resolvePromise(role, false);
      return Promise
        .all(FoundedRole.inherits.map(parent =>
          can({ enableLogger: false })(mappedRoles)(parent, operation, params)))
        .then(result => resolvePromise(role, result.indexOf(true) > -1))
        .catch(() => resolvePromise(role, false));
    }

    if (FoundedRole.can[operation]) return resolvePromise(role, true);

    return resolvePromise(role, false);
  });
};

const roleCanMap = (roleCan) => roleCan.reduce((acc, operation) =>
  (typeof operation === 'string' ?
    { ...acc, [operation]: 1 } :
    { ...acc, [operation.name]: operation.when }), {});

const mapRoles = roles => {
  if (typeof roles !== 'object') throw new TypeError('Expected an object as input');
  return Object.entries(roles).reduce((acc, role) => {
    const [roleName, roleValue] = role;
    return { ...acc,
      [roleName]: {
        can: roleCanMap(roleValue.can),
        inherits: roleValue.inherits
      }
    };
  }, {});
};

const RBAC = config => roles => ({ can: can(config)(mapRoles(roles)) });

export default RBAC;
