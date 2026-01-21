import dotenv from 'dotenv';

dotenv.config();

export const config = {
  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000'),
    apiVersion: process.env.API_VERSION || 'v1',
    logLevel: process.env.LOG_LEVEL || 'info'
  },

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'notification_service',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    min: parseInt(process.env.DB_POOL_MIN || '2'),
    max: parseInt(process.env.DB_POOL_MAX || '10')
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0'),
    ttl: parseInt(process.env.REDIS_TTL || '3600')
  },

  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'notification-service',
    groupId: process.env.KAFKA_GROUP_ID || 'notification-service-group',
    topics: {
      notifications: process.env.KAFKA_TOPIC_NOTIFICATIONS || 'notifications',
      notificationsDLQ: process.env.KAFKA_TOPIC_NOTIFICATIONS_DLQ || 'notifications-dlq'
    }
  },

  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com',
    fromName: process.env.SENDGRID_FROM_NAME || 'Notification Service'
  },

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    privateKeyPath: process.env.FIREBASE_PRIVATE_KEY_PATH,
    serviceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  },

  websocket: {
    port: parseInt(process.env.WS_PORT || '3001'),
    path: process.env.WS_PATH || '/notifications',
    corsOrigin: process.env.WS_CORS_ORIGIN || '*'
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET || 'change-this-secret-in-production',
    jwtExpiry: process.env.JWT_EXPIRY || '1h'
  },

  features: {
    enableEmail: process.env.ENABLE_EMAIL === 'true',
    enablePush: process.env.ENABLE_PUSH === 'true',
    enableWebSocket: process.env.ENABLE_WEBSOCKET === 'true',
    enableMetrics: process.env.ENABLE_METRICS === 'true'
  },

  metrics: {
    port: parseInt(process.env.METRICS_PORT || '9090')
  }
};
