import NodeCache from 'node-cache';

export class MemoryCache {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({
      stdTTL: 300,
      checkperiod: 60,
      useClones: false,
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const value = this.cache.get<T>(key);
    return value !== undefined ? value : null;
  }

  async set(key: string, value: any, ttl: number = 300): Promise<void> {
    this.cache.set(key, value, ttl);
  }

  async delete(key: string): Promise<void> {
    this.cache.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.cache.has(key);
  }

  async clear(): Promise<void> {
    this.cache.flushAll();
  }
}

export const cache = new MemoryCache();
