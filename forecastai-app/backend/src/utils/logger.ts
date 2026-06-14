import winston from 'winston';
import { AsyncLocalStorage } from 'async_hooks';

export const requestContext = new AsyncLocalStorage<{ requestId: string; path: string; method: string }>();

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'forecastai-api' },
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV !== 'production'
        ? winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, service, requestId, path, method, ...meta }) => {
              const parts = [`${timestamp} [${level}]: ${message}`];
              if (requestId) parts.push(`[${requestId}]`);
              if (meta && Object.keys(meta).length > 0) {
                parts.push(JSON.stringify(meta));
              }
              return parts.join(' ');
            })
          )
        : winston.format.json(),
    }),
  ],
});

function withContext(meta: Record<string, unknown> = {}): Record<string, unknown> {
  const store = requestContext.getStore();
  if (store) {
    return { ...meta, requestId: store.requestId, path: store.path, method: store.method };
  }
  return meta;
}

export function info(message: string, meta?: Record<string, unknown>): void {
  logger.info(message, withContext(meta));
}

export function warn(message: string, meta?: Record<string, unknown>): void {
  logger.warn(message, withContext(meta));
}

export function error(message: string, meta?: Record<string, unknown>): void {
  logger.error(message, withContext(meta));
}

export function debug(message: string, meta?: Record<string, unknown>): void {
  logger.debug(message, withContext(meta));
}

export default { info, warn, error, debug, requestContext, logger };
