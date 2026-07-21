'use strict';

require('dotenv').config();

const app = require('./app');
const logger = require('./infrastructure/logger');
const { connectDatabase } = require('./infrastructure/database/connection');
const { connectMessageQueue } = require('./infrastructure/messaging/connection');

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    // Connect to database (non-fatal in dev if unavailable)
    await connectDatabase();
    logger.info('Database connection established');
  } catch (err) {
    logger.warn({ err }, 'Database connection failed — continuing without DB (dev mode)');
  }

  try {
    // Connect to message queue (non-fatal)
    await connectMessageQueue();
    logger.info('Message queue connection established');
  } catch (err) {
    logger.warn({ err }, 'Message queue connection failed — continuing without MQ (dev mode)');
  }

  const server = app.listen(PORT, () => {
    logger.info({ port: PORT, env: process.env.NODE_ENV }, 'User Account Management Service started');
  });

  // Graceful shutdown
  const shutdown = (signal) => {
    logger.info({ signal }, 'Shutting down gracefully');
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap();
