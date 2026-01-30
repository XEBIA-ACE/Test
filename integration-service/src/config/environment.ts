import dotenv from 'dotenv';
import { cleanEnv, str, num, bool } from 'envalid';

dotenv.config();

/**
 * Validates and exports environment configuration
 * All sensitive data and configuration should be managed through environment variables
 */
export const config = {
  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    apiVersion: process.env.API_VERSION || 'v1',
    serviceName: process.env.SERVICE_NAME || 'integration-service',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'integration_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    poolMin: parseInt(process.env.DB_POOL_MIN || '2', 10),
    poolMax: parseInt(process.env.DB_POOL_MAX || '10', 10),
    ssl: process.env.DB_SSL === 'true',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    ttl: parseInt(process.env.REDIS_TTL || '3600', 10),
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'integration-service',
    groupId: process.env.KAFKA_GROUP_ID || 'integration-service-group',
    topics: {
      requests: process.env.KAFKA_TOPIC_REQUESTS || 'integration.requests',
      responses: process.env.KAFKA_TOPIC_RESPONSES || 'integration.responses',
      events: process.env.KAFKA_TOPIC_EVENTS || 'integration.events',
    },
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
    exchange: process.env.RABBITMQ_EXCHANGE || 'integration.exchange',
    queue: process.env.RABBITMQ_QUEUE || 'integration.queue',
    routingKey: process.env.RABBITMQ_ROUTING_KEY || 'integration.route',
  },
  externalApi: {
    baseUrl: process.env.EXTERNAL_API_BASE_URL || 'https://api.example.com',
    timeout: parseInt(process.env.EXTERNAL_API_TIMEOUT || '30000', 10),
    retryAttempts: parseInt(process.env.EXTERNAL_API_RETRY_ATTEMPTS || '3', 10),
    retryDelay: parseInt(process.env.EXTERNAL_API_RETRY_DELAY || '1000', 10),
  },
  soap: {
    endpointUrl: process.env.SOAP_ENDPOINT_URL || 'http://localhost:8080/soap/service',
    wsdlUrl: process.env.SOAP_WSDL_URL || 'http://localhost:8080/soap/service?wsdl',
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    jwtExpiry: process.env.JWT_EXPIRY || '1h',
    apiKey: process.env.API_KEY || 'your-api-key',
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },
  monitoring: {
    enableMetrics: process.env.ENABLE_METRICS === 'true',
    metricsPort: parseInt(process.env.METRICS_PORT || '9090', 10),
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000', 10),
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '300', 10),
    maxSize: parseInt(process.env.CACHE_MAX_SIZE || '1000', 10),
  },
};

export default config;
