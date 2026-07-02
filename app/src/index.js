'use strict';

const createApp = require('./infrastructure/http/app');
const config = require('./config');
const logger = require('./config/logger');

const app = createApp();

const server = app.listen(config.port, () => {
  logger.info(`User Management Service started`, {
    port: config.port,
    env: config.nodeEnv,
  });
});

// Graceful shutdown
const shutdown = (signal) => {
  logger.info(`Received ${signal} — shutting down gracefully`);
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force exit after 10 s if connections are still open
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = server; // exported for integration tests
