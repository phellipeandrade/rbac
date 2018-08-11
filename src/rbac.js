const underline = () => {
  let line = '';

  for (let i = 0; i < process.stdout.columns - 2; i++) {
    line = `${line}-`;
  }
  return line;
};

const logPermission = (role, operation, result) => {
  const fResult = result ?
    `\x1b[1;32m${result}\x1b[1;34m` :
    `\x1b[1;31m${result}\x1b[1;34m`;
  const fRole = `\x1b[1;32m${role}\x1b[1;34m`;
  const fOperation = `\x1b[1;32m${operation}\x1b[1;34m`;

  try {
    console.log('\x1b[33m%s\x1b[0m: ', underline()); // yellow
    console.log(
      '\x1b[1;34m%s\x1b[0m: ',
      `RBAC - ROLE: [${fRole}] OPERATION: [${fOperation}] PERMISSION: [${fResult}]`
    );
    console.log('\x1b[33m%s\x1b[0m: ', underline());
  } catch (e) {}
};

const can = mappedRoles => (role, operation, params) => {
  return new Promise((resolve, reject) => {
    const resolvePromise = (role, result) => {
      logPermission(role, operation, result);
      return resolve(result);
    };

    const rejectPromise = (role, result) => {
      logPermission(role, operation, result);
      return reject(result);
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

    if (!FoundedRole.can.includes(operation)) {
      if (!FoundedRole.inherits) return rejectPromise(role, false);
      return Promise.all(
        FoundedRole.inherits.map(parent => can(parent, operation, params))
      )
        .then(result => resolvePromise(role, result.indexOf(true) > -1))
        .catch(() => rejectPromise(role, false));
    }

    if (FoundedRole.can.includes(operation)) return resolvePromise(role, true);

    if (typeof FoundedRole.can[operation] === 'function') {
      return FoundedRole.can[operation](params, (err, result) => {
        if (err) return reject(err);
        if (!result) {
          if (FoundedRole.inherits) {
            return Promise.all(
              FoundedRole.inherits.map(parent => can(parent, operation, params))
            )
              .then(result => resolvePromise(role, result.indexOf(true) > -1))
              .catch(() => rejectPromise(role, false));
          }
          return resolvePromise(role, false);
        }
        return resolvePromise(role, true);
      });
    }
    return rejectPromise(role, false);
  });
};

const mapRoles = roles => {
  if (typeof roles !== 'object') {
    throw new TypeError('Expected an object as input');
  }
  const map = {};

  Object.keys(roles).forEach(role => {
    map[role] = { can: {} };
    if (roles[role].inherits) map[role].inherits = roles[role].inherits;
    roles[role].can.forEach(operation => {
      if (typeof operation === 'string') {
        map[role].can[operation] = 1;
      } else if (
        typeof operation.name === 'string' &&
        typeof operation.when === 'function'
      ) {
        map[role].can[operation.name] = operation.when;
      }
    });
  });
  return roles;
};

const RBAC = roles => ({
  can: can(mapRoles(roles))
});

export default RBAC;
