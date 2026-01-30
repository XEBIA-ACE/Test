import { App } from './app';
import { config } from './config/environment';
import logger from './utils/logger';

/**
 * Main application entry point
 * Starts the HTTP server and handles graceful shutdown
 */
async function bootstrap(): Promise<void> {
  try {
    logger.info('Starting Integration Service...', {
      environment: config.app.env,
      port: config.app.port,
      version: config.app.apiVersion,
    });

    // Create and initialize application
    const app = new App();
    await app.initialize();

    // Start HTTP server
    const server = app.getApp().listen(config.app.port, () => {
      logger.info(`Server is running on port ${config.app.port}`, {
        environment: config.app.env,
        documentation: `http://localhost:${config.app.port}/api-docs`,
      });
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await app.shutdown();
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown', error);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    // Handle termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught exception', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('Unhandled rejection', { reason });
      gracefulShutdown('unhandledRejection');
    });
  } catch (error) {
    logger.error('Failed to start application', error);
    process.exit(1);
  }
}

// Start application
bootstrap();
