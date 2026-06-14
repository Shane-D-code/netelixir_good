import NodeCache from 'node-cache';
declare const cache: NodeCache;
export declare function generateCacheKey(dataHash: string, params: Record<string, unknown>): string;
export declare function getCachedResult<T>(key: string): T | undefined;
export declare function setCachedResult<T>(key: string, value: T): void;
export declare function clearCache(): void;
export declare function getCacheStats(): {
    keys: number;
    hits: number;
    misses: number;
};
export default cache;
//# sourceMappingURL=cache.d.ts.map