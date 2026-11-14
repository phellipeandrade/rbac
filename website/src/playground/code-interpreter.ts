import {parse} from 'acorn';
import type {Context, VisualRole} from './engine';

type AstNode = {type: string; [key: string]: unknown};

function isAstNode(value: unknown): value is AstNode {
  return typeof value === 'object' && value !== null && 'type' in value
    && typeof (value as {type?: unknown}).type === 'string';
}

function nodeField(node: AstNode, field: string): AstNode | undefined {
  const value = node[field];
  return isAstNode(value) ? value : undefined;
}

function nodeArray(node: AstNode, field: string): AstNode[] {
  const value = node[field];
  if (!Array.isArray(value) || !value.every(isAstNode)) throw new Error('Unsupported syntax');
  return value;
}

function identifier(node: AstNode | undefined): string | undefined {
  return node?.type === 'Identifier' && typeof node.name === 'string' ? node.name : undefined;
}

function stringLiteral(node: AstNode | undefined): string | undefined {
  return node?.type === 'Literal' && typeof node.value === 'string' ? node.value : undefined;
}

function callArguments(node: AstNode): AstNode[] {
  return nodeArray(node, 'arguments');
}

function memberCall(node: AstNode | undefined, objectName: string, methodName: string): AstNode | undefined {
  if (node?.type !== 'CallExpression') return undefined;
  const callee = nodeField(node, 'callee');
  if (callee?.type !== 'MemberExpression' || callee.computed === true) return undefined;
  return identifier(nodeField(callee, 'object')) === objectName
    && identifier(nodeField(callee, 'property')) === methodName
    ? node
    : undefined;
}

function readObject(node: AstNode): Record<string, unknown> {
  if (node.type !== 'ObjectExpression') throw new Error('Expected an object literal');
  const result: Record<string, unknown> = Object.create(null);
  for (const property of nodeArray(node, 'properties')) {
    if (property.type !== 'Property' || property.computed === true || property.method === true) {
      throw new Error('Unsupported object property');
    }
    const keyNode = nodeField(property, 'key');
    const key = identifier(keyNode) ?? stringLiteral(keyNode);
    const value = nodeField(property, 'value');
    if (!key || !value || Object.hasOwn(result, key)) throw new Error('Invalid object property');
    result[key] = readLiteral(value);
  }
  return result;
}

function readLiteral(node: AstNode): unknown {
  if (node.type === 'Literal') {
    const value = node.value;
    if (value === null || typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number') return value;
  }
  if (node.type === 'ArrayExpression') {
    return nodeArray(node, 'elements').map(item => readLiteral(item));
  }
  if (node.type === 'ObjectExpression') return readObject(node);
  throw new Error('Only literal values are supported');
}

function expectObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('Expected an object');
  return value as Record<string, unknown>;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value) || !value.every(item => typeof item === 'string')) throw new Error('Expected an array of strings');
  return value;
}

function readRoles(value: unknown): VisualRole[] {
  const roles = expectObject(value);
  return Object.entries(roles).map(([id, value]) => {
    const definition = expectObject(value);
    const permissions = definition.can === undefined ? [] : stringArray(definition.can);
    const inherits = definition.inherits === undefined ? [] : stringArray(definition.inherits);
    return {
      id,
      inherits,
      rules: permissions.map(operation => ({operation, condition: 'always'}))
    };
  });
}

function readContext(value: unknown): Context {
  const context = expectObject(value);
  const userId = context.userId ?? '';
  const ownerId = context.ownerId ?? '';
  const isActive = context.isActive ?? false;
  if (typeof userId !== 'string' || typeof ownerId !== 'string' || typeof isActive !== 'boolean') {
    throw new Error('Invalid request context');
  }
  return {userId, ownerId, isActive};
}

export function interpretCode(source: string): {roles: VisualRole[]; role: string; operation: string; context: Context} {
  const programValue: unknown = parse(source, {ecmaVersion: 'latest', sourceType: 'module'});
  if (!isAstNode(programValue)) throw new Error('Invalid program');
  const statements = nodeArray(programValue, 'body');
  const imports = statements.filter(statement => statement.type === 'ImportDeclaration');
  if (imports.length !== 1 || stringLiteral(nodeField(imports[0], 'source')) !== '@rbac/core') {
    throw new Error('Import createRBAC from @rbac/core');
  }
  const createSpecifier = nodeArray(imports[0], 'specifiers').find(specifier =>
    specifier.type === 'ImportSpecifier' && identifier(nodeField(specifier, 'imported')) === 'createRBAC');
  const createRBACName = createSpecifier && identifier(nodeField(createSpecifier, 'local'));
  if (!createRBACName) throw new Error('Import createRBAC from @rbac/core');

  let rbacName: string | undefined;
  let rolesValue: unknown;
  let request: {role: string; operation: string; context: Context} | undefined;
  let resultName: string | undefined;
  let loggedResult = false;

  for (const statement of statements) {
    if (statement.type === 'ImportDeclaration') continue;
    if (statement.type === 'VariableDeclaration') {
      const declarations = nodeArray(statement, 'declarations');
      if (declarations.length !== 1) throw new Error('Use one variable declaration per statement');
      const declaration = declarations[0];
      const name = identifier(nodeField(declaration, 'id'));
      const init = nodeField(declaration, 'init');
      if (!name || !init) throw new Error('Invalid variable declaration');

      if (init.type === 'CallExpression' && identifier(nodeField(init, 'callee')) === createRBACName) {
        if (rbacName) throw new Error('Only one RBAC instance is supported');
        const args = callArguments(init);
        if (args.length !== 1) throw new Error('createRBAC expects one options object');
        const options = readObject(args[0]);
        rolesValue = options.roles;
        if (rolesValue === undefined) throw new Error('createRBAC requires roles');
        rbacName = name;
      } else if (init.type === 'AwaitExpression') {
        const call = nodeField(init, 'argument');
        const args = call && rbacName ? memberCall(call, rbacName, 'can') : undefined;
        if (!args || request || !call) throw new Error('Expected one awaited rbac.can() call');
        const values = callArguments(call);
        if (values.length !== 3) throw new Error('rbac.can expects role, operation, and context');
        const role = stringLiteral(values[0]);
        const operation = stringLiteral(values[1]);
        if (role === undefined || operation === undefined) throw new Error('Role and operation must be string literals');
        request = {role, operation, context: readContext(readLiteral(values[2]))};
        resultName = name;
      } else {
        throw new Error('Unsupported variable initializer');
      }
      continue;
    }
    if (statement.type === 'ExpressionStatement') {
      const expression = nodeField(statement, 'expression');
      const logCall = memberCall(expression, 'console', 'log');
      if (!logCall || !resultName || loggedResult) throw new Error('Only console.log(result) is supported');
      const args = callArguments(logCall);
      if (args.length !== 1 || identifier(args[0]) !== resultName) throw new Error('Log the rbac.can() result');
      loggedResult = true;
      continue;
    }
    throw new Error('Unsupported statement');
  }

  if (!rbacName || !request || !loggedResult || rolesValue === undefined) throw new Error('Incomplete RBAC example');
  const roles = readRoles(rolesValue);
  if (!roles.some(role => role.id === request?.role)) throw new Error('The requested role is not defined');
  return {...request, roles};
}
