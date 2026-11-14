---
id: patterns
title: Wildcards e expressões regulares
---

# Agrupe operações com padrões

Prefira **strings exatas** para permissões simples. Para operações de um mesmo grupo, utilize glob como `posts:*`. O `*` corresponde a um segmento sem barras; `**` aceita caminhos mais profundos. O padrão corresponde à operação inteira.

```ts
import { createRBAC } from '@rbac/core';

const auth = createRBAC({ roles: {
  staff: { can: ['posts:*', 'files/**'] }
} });

console.log(await auth.can('staff', 'posts:create')); // true
console.log(await auth.can('staff', 'posts:remove')); // true
console.log(await auth.can('staff', 'users:create')); // false
```

Strings com barras delimitadoras (`'/^reports:(read|export)$/'`) representam permissões com expressão regular. Strings comuns são **literais** quando não contêm wildcard. O argumento de operação de `can()` também aceita `RegExp` para consultar permissões compatíveis.

```ts
import { createRBAC } from '@rbac/core';

const reports = createRBAC({ roles: { analyst: { can: ['reports:read', 'reports:export'] } } });
console.log(await reports.can('analyst', /^reports:read$/)); // true
```

Use nomes previsíveis e evite wildcards amplos demais. Expressões regulares com flags `g`/`y` têm o `lastIndex` reinicializado para decisões repetíveis. A conversão de padrões utiliza cache limitado; condições continuam sendo avaliadas a cada requisição. Veja [segurança e desempenho](./security-performance.md).
