import { Request, Response, NextFunction } from 'express';
import { register, Counter, Histogram } from 'prom-client';

/**
 * Metrics middleware
 * Collects Prometheus metrics for monitoring
 */

// HTTP request counter
const httpRequestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

// HTTP request duration histogram
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

// Integration counter
export const integrationCounter = new Counter({
  name: 'integrations_total',
  help: 'Total number of integrations',
  labelNames: ['source_system', 'target_system', 'status'],
});

// Integration duration histogram
export const integrationDuration = new Histogram({
  name: 'integration_duration_seconds',
  help: 'Duration of integration processing in seconds',
  labelNames: ['source_system', 'target_system', 'status'],
  buckets: [1, 5, 10, 30, 60],
});

/**
 * Metrics collection middleware
 */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const route = req.route?.path || req.path;

  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;

    httpRequestCounter.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: res.statusCode,
      },
      duration
    );
  });

  next();
};

/**
 * Metrics endpoint handler
 */
export const metricsHandler = async (req: Request, res: Response): Promise<void> => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};
