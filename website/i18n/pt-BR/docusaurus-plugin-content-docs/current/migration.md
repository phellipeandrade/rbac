---
id: migration
title: Visão geral de migração
---

# Atualizar o RBAC

A versão atual é a **4.x**, distribuída como `@rbac/core` e pacotes opcionais de integração. O pacote anterior `@rbac/rbac` utiliza outra factory e organização de exports. Siga o guia correspondente à versão instalada:

- [1.x → 2.x](./migration-1-to-2.md) — mudanças históricas de TypeScript, atualização de roles e integrações.
- [2.x → 3.x](./migration-2-to-3.md) — exports CommonJS/ESM, callbacks condicionais e validação de identificadores SQL.
- **[3.x → 4.x](./migration-3-to-4.md)** — novos pacotes, factory com objeto único, exports nomeados, tipos e migração das integrações.

Aplicações nas versões 1.x ou 2.x devem consultar os guias intermediários na ordem. O seletor de versões mantém a referência histórica de **1.x** e **2.x**. Para novas aplicações, consulte a [instalação da v4](./installation.md) e a [referência de API](./api/index.md).

Qualquer migração de autorização exige testes de **permissões concedidas e negadas**, condições, herança, regex/globs, atualizações em execução e isolamento entre tenants. O guia da v4 inclui um checklist de verificação.
