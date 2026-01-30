import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../../utils/logger';

/**
 * Request logging middleware
 * Logs incoming requests and outgoing responses with correlation IDs
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();
  const startTime = Date.now();

  // Attach correlation ID to request
  req.headers['x-correlation-id'] = correlationId;

  const logger = new Logger({ correlationId });

  // Log incoming request
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data): Response {
    res.send = originalSend;

    const duration = Date.now() - startTime;

    logger.info('Outgoing response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });

    return res.send(data);
  };

  next();
};
