---
name: Bug report
about: Create a report to help us improve
title: ''
labels: ''
assignees: ''

---

# Bug Report

## Summary

**Describe the bug in one concise sentence**  
A clear and brief description of what the unexpected behavior is.

## Version

- **@rbac/rbac version:**  
  (e.g., `2.1.1`)

- **Environment:**  
  (e.g., Browser, Node.js version, Deno, Bun, Cloudflare Workers)

## Reproduction Steps

Steps to reliably reproduce the issue:

1. Go to …
2. Run …
3. Call …
4. Observe …

## Expected Behavior

Describe what you expected to happen instead of the bug.

Example:  
The role check should return `true` for user with `admin` role when permission is defined as allowed.

## Actual Behavior

Describe what actually happened.

Example:  
The role check returns `false` despite correct role and permission.

## Minimal Reproduction

Provide a minimal code snippet that reproduces the issue:

```js
import { RBAC } from '@rbac/rbac';

const rbac = new RBAC({ rules: [...] });

const result = rbac.can('admin', 'some:action');

console.log(result);
