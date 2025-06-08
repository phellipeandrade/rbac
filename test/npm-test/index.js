const assert = require('assert');
const rbac = require('@rbac/rbac').default;

// Definindo as roles padrão
const defaultRoles = {
  user: {
    can: ['products:find']
  },
  admin: {
    can: ['products:find', 'products:edit', 'products:delete']
  }
};

// Testando a importação do pacote
console.log('Testando importação do pacote...');
assert(typeof rbac === 'function', 'O pacote deve exportar uma função');

// Testando configuração básica
console.log('Testando configuração básica...');
const RBACInstance = rbac({ enableLogger: false })(defaultRoles);
assert(typeof RBACInstance === 'object', 'A configuração deve retornar um objeto');
assert(typeof RBACInstance.can === 'function', 'O objeto deve ter o método can');

// Testando permissões básicas
console.log('Testando permissões básicas...');

// Testando permissões do usuário
async function testUserPermissions() {
  const userCanFind = await RBACInstance.can('user', 'products:find');
  assert(userCanFind, 'Usuário deve ter permissão para encontrar produtos');

  const userCannotEdit = await RBACInstance.can('user', 'products:edit');
  assert(!userCannotEdit, 'Usuário não deve ter permissão para editar produtos');
}

// Testando permissões do admin
async function testAdminPermissions() {
  const adminCanFind = await RBACInstance.can('admin', 'products:find');
  assert(adminCanFind, 'Admin deve ter permissão para encontrar produtos');

  const adminCanEdit = await RBACInstance.can('admin', 'products:edit');
  assert(adminCanEdit, 'Admin deve ter permissão para editar produtos');

  const adminCanDelete = await RBACInstance.can('admin', 'products:delete');
  assert(adminCanDelete, 'Admin deve ter permissão para deletar produtos');
}

// Executando os testes
(async () => {
  try {
    await testUserPermissions();
    await testAdminPermissions();
    console.log('✅ Todos os testes passaram com sucesso!');
  } catch (error) {
    console.error('❌ Teste falhou:', error);
    process.exit(1);
  }
})();

console.log('✅ Todos os testes passaram com sucesso!');

// Função para simular uma condição assíncrona
async function testAsyncCondition() {
  console.log('Testando condição assíncrona...');
  
  const rolesWithAsync = {
    user: {
      can: [
        {
          name: 'products:edit',
          when: (params, callback) => {
            const result = params.accountId === '123';
            callback(null, result);
          }
        },
        'products:find'
      ]
    }
  };

  const RBACAsync = rbac({ enableLogger: false })(rolesWithAsync);
  
  // Testando condição verdadeira
  const canEdit = await RBACAsync.can('user', 'products:edit', { accountId: '123' });
  assert(canEdit === true, 'Deve ter permissão quando condição é verdadeira');
  
  // Testando condição falsa
  const cannotEdit = await RBACAsync.can('user', 'products:edit', { accountId: '456' });
  assert(cannotEdit === false, 'Não deve ter permissão quando condição é falsa');
  
  // Testando permissão básica
  const canFind = await RBACAsync.can('user', 'products:find');
  assert(canFind === true, 'Deve ter permissão básica');
  
  // Testando condição falsa com parâmetro undefined
  const cannotEditNoParams = await RBACAsync.can('user', 'products:edit', { accountId: undefined });
  assert(cannotEditNoParams === false, 'Não deve ter permissão sem parâmetros');
  
  // Testando condição falsa com parâmetro vazio
  const cannotEditEmptyParams = await RBACAsync.can('user', 'products:edit', {});
  assert(cannotEditEmptyParams === false, 'Não deve ter permissão com parâmetros vazios');
  
  console.log('✅ Testes de condição assíncrona passaram com sucesso!');
}

// Adicionando teste de condição assíncrona
(async () => {
  try {
    await testUserPermissions();
    await testAdminPermissions();
    await testAsyncCondition();
    console.log('✅ Todos os testes passaram com sucesso!');
  } catch (error) {
    console.error('❌ Teste falhou:', error);
    process.exit(1);
  }
})();
