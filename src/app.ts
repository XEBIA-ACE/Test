import express, { Application } from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { Server } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { config } from './config';
import { logger } from './infrastructure/logging/logger';
import { swaggerSpec } from './api/swagger';

import { DatabaseConnection } from './infrastructure/database/connection';
import { RedisService } from './infrastructure/cache/RedisService';
import { KafkaService } from './infrastructure/messaging/KafkaService';

import { NotificationRepository } from './infrastructure/database/repositories/NotificationRepository';
import { NotificationService } from './application/services/NotificationService';
import { RateLimitService } from './application/services/RateLimitService';

import { EmailProvider } from './infrastructure/providers/EmailProvider';
import { PushProvider } from './infrastructure/providers/PushProvider';
import { WebSocketProvider } from './infrastructure/providers/WebSocketProvider';

import { createNotificationRouter } from './api/routes/notifications';
import { createHealthRouter } from './api/routes/health';
import { errorHandler, notFoundHandler } from './api/middleware/errorHandler';
import { rateLimitMiddleware } from './api/middleware/rateLimit';

import { NotificationType } from './domain/models/Notification';

export class App {
  private app: Application;
  private server: Server | null = null;
  private io: SocketIOServer | null = null;

  private db: DatabaseConnection;
  private redis: RedisService;
  private kafka: KafkaService;

  private notificationService: NotificationService;
  private rateLimitService: RateLimitService;

  constructor() {
    this.app = express();
    this.initializeInfrastructure();
    this.initializeMiddleware();
    this.initializeServices();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeInfrastructure(): void {
    this.db = new DatabaseConnection(config.database);
    this.redis = new RedisService(config.redis);
    this.kafka = new KafkaService({
      brokers: config.kafka.brokers,
      clientId: config.kafka.clientId,
      groupId: config.kafka.groupId
    });
  }

  private initializeMiddleware(): void {
    this.app.use(helmet());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(
      pinoHttp({
        logger
      })
    );
  }

  private initializeServices(): void {
    const repository = new NotificationRepository(this.db);

    // Initialize providers
    const providers = new Map();

    if (config.features.enableEmail && config.sendgrid.apiKey) {
      providers.set(
        NotificationType.EMAIL,
        new EmailProvider({
          apiKey: config.sendgrid.apiKey,
          fromEmail: config.sendgrid.fromEmail,
          fromName: config.sendgrid.fromName
        })
      );
      logger.info('Email provider initialized');
    }

    if (config.features.enablePush && config.firebase.projectId) {
      providers.set(
        NotificationType.PUSH,
        new PushProvider({
          projectId: config.firebase.projectId,
          privateKeyPath: config.firebase.privateKeyPath,
          serviceAccountJson: config.firebase.serviceAccountJson
        })
      );
      logger.info('Push notification provider initialized');
    }

    if (config.features.enableWebSocket) {
      const wsProvider = new WebSocketProvider();
      providers.set(NotificationType.WEBSOCKET, wsProvider);

      // Initialize Socket.IO server (will be set up after HTTP server starts)
      this.io = new SocketIOServer({
        cors: {
          origin: config.websocket.corsOrigin,
          methods: ['GET', 'POST']
        },
        path: config.websocket.path
      });

      wsProvider.setSocketServer(this.io);
      logger.info('WebSocket provider initialized');
    }

    this.notificationService = new NotificationService(repository, providers, this.redis, this.kafka);

    this.rateLimitService = new RateLimitService(this.redis, {
      windowMs: config.rateLimit.windowMs,
      maxRequests: config.rateLimit.maxRequests
    });
  }

  private initializeRoutes(): void {
    // Swagger documentation
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    // Health checks
    this.app.use('/health', createHealthRouter(this.db, this.redis, this.kafka));

    // API routes with rate limiting
    this.app.use(
      `/api/${config.app.apiVersion}/notifications`,
      rateLimitMiddleware(this.rateLimitService),
      createNotificationRouter(this.notificationService)
    );

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        service: 'notification-service',
        version: config.app.apiVersion,
        status: 'running',
        documentation: '/api-docs'
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Connect to infrastructure
      await this.kafka.connect();
      logger.info('Kafka connected');

      // Subscribe to notification topics
      await this.kafka.subscribe(config.kafka.topics.notifications, async (message) => {
        try {
          await this.notificationService.sendNotification(message.id);
        } catch (error: any) {
          logger.error({ error: error.message, notificationId: message.id }, 'Error processing notification');
        }
      });

      // Start HTTP server
      this.server = this.app.listen(config.app.port, () => {
        logger.info({ port: config.app.port }, `Server started on port ${config.app.port}`);
        logger.info(`API Documentation: http://localhost:${config.app.port}/api-docs`);
      });

      // Attach Socket.IO to HTTP server
      if (this.io) {
        this.io.attach(this.server);
        logger.info({ port: config.app.port }, 'WebSocket server attached');
      }

      // Start scheduled job for processing scheduled notifications
      this.startScheduledJobs();
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to start application');
      throw error;
    }
  }

  private startScheduledJobs(): void {
    // Process scheduled notifications every minute
    setInterval(async () => {
      try {
        await this.notificationService.processScheduledNotifications();
      } catch (error: any) {
        logger.error({ error: error.message }, 'Error processing scheduled notifications');
      }
    }, 60000);

    logger.info('Scheduled jobs started');
  }

  public async stop(): Promise<void> {
    logger.info('Shutting down gracefully...');

    if (this.server) {
      this.server.close();
    }

    if (this.io) {
      this.io.close();
    }

    await this.kafka.disconnect();
    await this.redis.disconnect();
    await this.db.close();

    logger.info('Shutdown complete');
  }

  public getApp(): Application {
    return this.app;
  }
}
