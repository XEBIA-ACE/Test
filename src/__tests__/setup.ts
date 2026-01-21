// Jest setup file for test environment configuration

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';

// Mock environment variables
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'notification_service_test';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'postgres';

process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';

process.env.KAFKA_BROKERS = 'localhost:9092';
process.env.KAFKA_CLIENT_ID = 'notification-service-test';
process.env.KAFKA_GROUP_ID = 'notification-service-test-group';

process.env.SENDGRID_API_KEY = 'test-api-key';
process.env.SENDGRID_FROM_EMAIL = 'test@example.com';

process.env.FIREBASE_PROJECT_ID = 'test-project';

process.env.ENABLE_EMAIL = 'false';
process.env.ENABLE_PUSH = 'false';
process.env.ENABLE_WEBSOCKET = 'false';

// Extend Jest timeout for integration tests
jest.setTimeout(30000);
