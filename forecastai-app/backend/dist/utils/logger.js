"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestContext = void 0;
exports.info = info;
exports.warn = warn;
exports.error = error;
exports.debug = debug;
const winston_1 = __importDefault(require("winston"));
const async_hooks_1 = require("async_hooks");
exports.requestContext = new async_hooks_1.AsyncLocalStorage();
const logger = winston_1.default.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
    defaultMeta: { service: 'forecastai-api' },
    transports: [
        new winston_1.default.transports.Console({
            format: process.env.NODE_ENV !== 'production'
                ? winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.printf(({ timestamp, level, message, service, requestId, path, method, ...meta }) => {
                    const parts = [`${timestamp} [${level}]: ${message}`];
                    if (requestId)
                        parts.push(`[${requestId}]`);
                    if (meta && Object.keys(meta).length > 0) {
                        parts.push(JSON.stringify(meta));
                    }
                    return parts.join(' ');
                }))
                : winston_1.default.format.json(),
        }),
    ],
});
function withContext(meta = {}) {
    const store = exports.requestContext.getStore();
    if (store) {
        return { ...meta, requestId: store.requestId, path: store.path, method: store.method };
    }
    return meta;
}
function info(message, meta) {
    logger.info(message, withContext(meta));
}
function warn(message, meta) {
    logger.warn(message, withContext(meta));
}
function error(message, meta) {
    logger.error(message, withContext(meta));
}
function debug(message, meta) {
    logger.debug(message, withContext(meta));
}
exports.default = { info, warn, error, debug, requestContext: exports.requestContext, logger };
//# sourceMappingURL=logger.js.map