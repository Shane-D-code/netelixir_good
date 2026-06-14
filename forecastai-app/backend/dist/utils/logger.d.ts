import winston from 'winston';
import { AsyncLocalStorage } from 'async_hooks';
export declare const requestContext: AsyncLocalStorage<{
    requestId: string;
    path: string;
    method: string;
}>;
export declare function info(message: string, meta?: Record<string, unknown>): void;
export declare function warn(message: string, meta?: Record<string, unknown>): void;
export declare function error(message: string, meta?: Record<string, unknown>): void;
export declare function debug(message: string, meta?: Record<string, unknown>): void;
declare const _default: {
    info: typeof info;
    warn: typeof warn;
    error: typeof error;
    debug: typeof debug;
    requestContext: AsyncLocalStorage<{
        requestId: string;
        path: string;
        method: string;
    }>;
    logger: winston.Logger;
};
export default _default;
//# sourceMappingURL=logger.d.ts.map