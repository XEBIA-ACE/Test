/**
 * Jest test setup and configuration
 * Runs before all tests
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Mock environment variables
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'test_db';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';

process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';

process.env.KAFKA_BROKERS = 'localhost:9092';
process.env.RABBITMQ_URL = 'amqp://localhost:5672';

// Set test timeout
jest.setTimeout(10000);

// Global test utilities
global.beforeAll(() => {
  console.log('Starting test suite...');
});

global.afterAll(() => {
  console.log('Test suite completed');
});
