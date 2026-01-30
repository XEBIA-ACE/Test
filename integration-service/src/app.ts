import express, { Application } from 'express';
import 'express-async-errors';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { join } from 'path';

// Import middleware
import { requestLogger } from './api/middleware/requestLogger';
import { metricsMiddleware, metricsHandler } from './api/middleware/metrics';
import { errorHandler, notFoundHandler } from './api/middleware/errorHandler';

// Import routes
import { createIntegrationRoutes } from './api/routes/integrationRoutes';
import { createHealthRoutes } from './api/routes/healthRoutes';

// Import controllers
import { IntegrationController } from './api/controllers/IntegrationController';
import { HealthController } from './api/controllers/HealthController';

// Import dependencies
import { IntegrationService } from './application/services/IntegrationService';
import { PostgresIntegrationRepository } from './infrastructure/database/PostgresIntegrationRepository';
import { RedisCacheService } from './infrastructure/cache/RedisCacheService';
import { KafkaMessageBroker } from './infrastructure/messaging/KafkaMessageBroker';
import { ExternalApiClient } from './infrastructure/http/ExternalApiClient';

import { config } from './config/environment';
import { Logger } from './utils/logger';

/**
 * Application class
 * Bootstraps and configures the Express application
 */
export class App {
  private app: Application;
  private logger: Logger;

  // Dependencies
  private integrationRepository: PostgresIntegrationRepository;
  private cacheService: RedisCacheService;
  private messageBroker: KafkaMessageBroker;
  private externalApiClient: ExternalApiClient;

  // Services
  private integrationService: IntegrationService;

  // Controllers
  private integrationController: IntegrationController;
  private healthController: HealthController;

  constructor() {
    this.app = express();
    this.logger = new Logger({ service: 'App' });

    // Initialize dependencies
    this.initializeDependencies();

    // Initialize services
    this.initializeServices();

    // Initialize controllers
    this.initializeControllers();

    // Setup middleware
    this.setupMiddleware();

    // Setup routes
    this.setupRoutes();

    // Setup error handling
    this.setupErrorHandling();
  }

  /**
   * Initializes infrastructure dependencies
   */
  private initializeDependencies(): void {
    this.integrationRepository = new PostgresIntegrationRepository();
    this.cacheService = new RedisCacheService();
    this.messageBroker = new KafkaMessageBroker();
    this.externalApiClient = new ExternalApiClient();
  }

  /**
   * Initializes application services
   */
  private initializeServices(): void {
    this.integrationService = new IntegrationService(
      this.integrationRepository,
      this.messageBroker,
      this.cacheService,
      this.externalApiClient
    );
  }

  /**
   * Initializes controllers
   */
  private initializeControllers(): void {
    this.integrationController = new IntegrationController(this.integrationService);
    this.healthController = new HealthController();
  }

  /**
   * Sets up middleware
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());

    // CORS
    this.app.use(
      cors({
        origin: config.cors.origin,
        credentials: config.cors.credentials,
      })
    );

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use(requestLogger);

    // Metrics collection
    if (config.monitoring.enableMetrics) {
      this.app.use(metricsMiddleware);
    }
  }

  /**
   * Sets up application routes
   */
  private setupRoutes(): void {
    const apiPrefix = `/api/${config.app.apiVersion}`;

    // Health routes (no prefix)
    this.app.use('/', createHealthRoutes(this.healthController));

    // API routes
    this.app.use(`${apiPrefix}/integrations`, createIntegrationRoutes(this.integrationController));

    // Metrics endpoint
    if (config.monitoring.enableMetrics) {
      this.app.get('/metrics', metricsHandler);
    }

    // API documentation
    const swaggerDocument = YAML.load(join(__dirname, 'api/docs/swagger.yaml'));
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        service: config.app.serviceName,
        version: config.app.apiVersion,
        environment: config.app.env,
        documentation: '/api-docs',
        health: '/health',
      });
    });
  }

  /**
   * Sets up error handling
   */
  private setupErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  /**
   * Initializes external connections (database, message brokers, etc.)
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing application connections...');

    try {
      // Connect to message broker
      await this.messageBroker.connect();

      // Setup message handlers
      await this.setupMessageHandlers();

      this.logger.info('Application initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize application', error);
      throw error;
    }
  }

  /**
   * Sets up message queue handlers
   */
  private async setupMessageHandlers(): Promise<void> {
    // Subscribe to integration requests
    await this.messageBroker.subscribe(
      config.kafka.topics.requests,
      async (message: Record<string, unknown>) => {
        try {
          const integrationId = message.integrationId as string;
          await this.integrationService.processIntegration(integrationId);
        } catch (error) {
          this.logger.error('Error processing integration message', error);
        }
      }
    );
  }

  /**
   * Gracefully shuts down the application
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down application...');

    try {
      await this.messageBroker.disconnect();
      await this.cacheService.disconnect();
      await this.integrationRepository.disconnect();

      this.logger.info('Application shut down successfully');
    } catch (error) {
      this.logger.error('Error during shutdown', error);
      throw error;
    }
  }

  /**
   * Returns the Express application instance
   */
  getApp(): Application {
    return this.app;
  }
}

export default App;
