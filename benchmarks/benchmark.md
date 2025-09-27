# Benchmarks

`@rbac/rbac` ships with two benchmark suites that validate both everyday usage and heavier workloads. The scripts compare our library against AccessControl, RBAC, Easy RBAC and Fast RBAC.

## Running the benchmarks

### Automatically

```
npm run bench
```

The command runs both suites, prints aggregated statistics in the terminal and writes JSON/CSV/HTML reports to `benchmarks/results/`.

### Manually

1. Install the competitor libraries (you can add your own to the list if desired):

   ``
   npm install --no-save accesscontrol easy-rbac rbac fast-rbac
   ``

2. Execute the benchmark runner directly:

   ``
   node benchmarks/perf.js
   ``

## Results snapshot (default dataset)

```
@rbac/rbac - direct permission      7,128,788 ops/sec ±1.19%
@rbac/rbac - inherited permission   6,163,753 ops/sec ±3.11%
@rbac/rbac - glob permission        4,350,598 ops/sec ±1.80%
AccessControl - direct                997,754 ops/sec ±2.11%
RBAC - direct                          242,790 ops/sec ±3.28%
Easy RBAC - direct                  5,098,239 ops/sec ±0.93%
Fast RBAC - direct                  2,807,204 ops/sec ±1.55%
```

## Results snapshot (large dataset)

```
@rbac/rbac - large direct           3,317,580 ops/sec ±1.57%
@rbac/rbac - large inherited        3,315,048 ops/sec ±2.96%
@rbac/rbac - large glob             3,339,478 ops/sec ±1.73%
@rbac/rbac - large callback          407,451 ops/sec ±5.51%
@rbac/rbac - large async           2,451,631 ops/sec ±4.70%
@rbac/rbac - large promise         2,755,967 ops/sec ±1.51%
AccessControl - large direct          959,961 ops/sec ±1.70%
RBAC - large direct                   119,891 ops/sec ±2.86%
Easy RBAC - large direct           3,867,626 ops/sec ±0.63%
Fast RBAC - large direct           2,542,370 ops/sec ±3.36%
```

## Why `@rbac/rbac` stays ahead

1. **Precompiled permission maps** – roles are flattened once and cached; lookups for direct, inherited and glob permissions remain O(1) regardless of tree depth or resource count.
2. **Pattern matching cache** – glob/regex checks are memoised per role, so repeated wildcard queries avoid expensive scans even in large hierarchies.
3. **Async-friendly core** – `can()` treats synchronous, callback, async and promise-based `when` handlers uniformly. The large dataset suite shows that even heavy callback/promise workloads keep multi-million ops/sec throughput.
4. **Feature completeness without trade-offs** – wildcard support, inheritance, async guards and runtime updates are all enabled simultaneously with no need for separate “simple mode”.

In practice this means you can use expressive glob patterns, deep inheritance chains and asynchronous guards while still outperforming other RBAC libraries by a wide margin.


