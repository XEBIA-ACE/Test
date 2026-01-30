import pino from 'pino';
import { config } from '../config/environment';

/**
 * Centralized logging utility using Pino
 * Provides structured logging with correlation IDs and context
 */
const logger = pino({
  level: config.logging.level,
  ...(config.app.env === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
  base: {
    service: config.app.serviceName,
    environment: config.app.env,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
});

/**
 * Creates a child logger with additional context
 */
export const createLogger = (context: Record<string, unknown>): pino.Logger => {
  return logger.child(context);
};

/**
 * Logger wrapper with common log methods
 */
export class Logger {
  private logger: pino.Logger;

  constructor(context?: Record<string, unknown>) {
    this.logger = context ? logger.child(context) : logger;
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.logger.info(data, message);
  }

  error(message: string, error?: Error | Record<string, unknown>): void {
    this.logger.error(error, message);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.logger.warn(data, message);
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.logger.debug(data, message);
  }

  child(context: Record<string, unknown>): Logger {
    const childLogger = new Logger();
    childLogger.logger = this.logger.child(context);
    return childLogger;
  }
}

export default logger;
