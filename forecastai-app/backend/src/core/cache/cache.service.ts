import NodeCache from 'node-cache';

const cache = new NodeCache({
  stdTTL: 3600,
  checkperiod: 600,
  maxKeys: 20,
});

export function generateCacheKey(dataHash: string, params: Record<string, unknown>): string {
  const sorted = Object.keys(params).sort().reduce((acc, key) => {
    acc[key] = params[key];
    return acc;
  }, {} as Record<string, unknown>);
  return `${dataHash}_${JSON.stringify(sorted)}`;
}

export function getCachedResult<T>(key: string): T | undefined {
  return cache.get<T>(key);
}

export function setCachedResult<T>(key: string, value: T): void {
  cache.set(key, value);
}

export function clearCache(): void {
  cache.flushAll();
}

export function getCacheStats(): { keys: number; hits: number; misses: number } {
  return {
    keys: cache.keys().length,
    hits: cache.getStats().hits,
    misses: cache.getStats().misses,
  };
}

export default cache;
