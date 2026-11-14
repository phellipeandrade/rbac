/** Least-recently-used Map helpers. Maps retain insertion order. */
export const cacheGet = <K, V>(cache: Map<K, V>, key: K): V | undefined => {
  const value = cache.get(key);
  if (value !== undefined) {
    cache.delete(key);
    cache.set(key, value);
  }
  return value;
};

export const cacheSet = <K, V>(cache: Map<K, V>, key: K, value: V, limit: number): V => {
  cache.delete(key);
  cache.set(key, value);
  if (cache.size > limit) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  return value;
};

export const REGEX_CACHE_LIMIT = 512;
export const GLOB_CACHE_LIMIT = 512;
export const OPERATION_CACHE_LIMIT = 512;
export const ROLE_CACHE_LIMIT = 256;
export const MATCH_CACHE_LIMIT = 512;
