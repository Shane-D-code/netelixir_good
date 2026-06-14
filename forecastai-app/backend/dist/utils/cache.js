"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCacheKey = generateCacheKey;
exports.getCachedResult = getCachedResult;
exports.setCachedResult = setCachedResult;
exports.clearCache = clearCache;
exports.getCacheStats = getCacheStats;
const node_cache_1 = __importDefault(require("node-cache"));
const cache = new node_cache_1.default({
    stdTTL: 3600,
    checkperiod: 600,
    maxKeys: 20,
});
function generateCacheKey(dataHash, params) {
    const sorted = Object.keys(params).sort().reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
    }, {});
    return `${dataHash}_${JSON.stringify(sorted)}`;
}
function getCachedResult(key) {
    return cache.get(key);
}
function setCachedResult(key, value) {
    cache.set(key, value);
}
function clearCache() {
    cache.flushAll();
}
function getCacheStats() {
    return {
        keys: cache.keys().length,
        hits: cache.getStats().hits,
        misses: cache.getStats().misses,
    };
}
exports.default = cache;
//# sourceMappingURL=cache.js.map