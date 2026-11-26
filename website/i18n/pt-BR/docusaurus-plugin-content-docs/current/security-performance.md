---
id: security-performance
title: Segurança, erros e desempenho
---

# Autorização em produção

RBAC **nega por padrão**: role desconhecida ou operação sem permissão retorna `false`. Exceções ou rejeições em `when` também negam a permissão correspondente. Entretanto, a segurança depende da confiabilidade das roles, dos parâmetros e das operações informados pela aplicação.

## Entradas confiáveis

Obtenha a role do usuário por sessão validada ou identidade verificada no servidor, não do corpo ou dos headers da requisição. Verifique a posse do recurso e o escopo do tenant com dados confiáveis; não aceite `ownerId` informado pelo cliente como prova. Aplique `await rbac.can()` **na operação protegida**, inclusive em jobs, endpoints de escrita e métodos de serviço. Autenticação e associação de usuários a roles são responsabilidades da aplicação.

## Falhas e erros

Falhas de condições negam a permissão afetada. Middlewares podem propagar erros de infraestrutura conforme o framework (Express e Nest usam `next(err)`). Trate erros de inicialização ou leitura de banco na aplicação; falha do adapter não significa acesso permitido. Se várias permissões coincidirem, outra condição que retorne `true` ainda poderá autorizar.

## Cache

- A correspondência entre permissões e padrões utiliza caches limitados.
- Resultados condicionais dependentes de `params` são avaliados a cada chamada, sem cache.
- `addRole()`, `updateRoles()` e `replaceRoles()` reconstroem a herança e invalidam os caches de correspondência de permissões.
- Expressões regulares com estado têm `lastIndex` reiniciado em verificações repetidas, inclusive com flags `g`/`y`.

Meça o desempenho com suas próprias roles e operações. O repositório oferece `npm run bench`, `npm run bench:engine` e `npm run bench:micro`. Consulte o [relatório de benchmarks](./benchmarks.md) para tabelas, gráficos Mermaid e instruções de reprodução. Os resultados dependem do ambiente; não são garantias de throughput.

## Armazenamento e concorrência

Os adapters SQL vinculam parâmetros de dados e validam/escapam identificadores. Defina schema e chaves únicas coerentes com a estratégia de upsert. Informe um tenant correto a cada requisição.

Cada instância guarda um snapshot em memória. Após ler com sucesso o conjunto completo de roles do banco, [aplique-o com `replaceRoles()`](./runtime.md#reload-the-complete-role-set) para remover as permissões das roles excluídas. Coordene a atualização entre os processos que atendem o tenant.
