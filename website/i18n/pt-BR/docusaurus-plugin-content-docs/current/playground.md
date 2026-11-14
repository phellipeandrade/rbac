---
id: playground
title: Playground interativo
---

# Explore decisões de permissão

Acesse o [playground RBAC](/playground) para experimentar definições de roles, herança, condições e verificações. Ele utiliza o motor RBAC do próprio repositório.

Comece com uma role `reader` que permite `posts:read`, herde-a em `editor` e confirme que `editor` pode ler enquanto `reader` não pode escrever. Utilize os guias de [permissões](./roles-permissions.md) e [condições](./conditions.md) para interpretar os resultados.

Os exemplos do playground são demonstrações. Em aplicações reais, aplique as verificações à identidade confiável e ao contexto de recurso obtido no servidor.
