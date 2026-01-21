import request from 'supertest';
import { App } from '../../app';

describe('API Integration Tests', () => {
  let app: App;
  let server: any;

  beforeAll(async () => {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.DB_HOST = 'localhost';
    process.env.REDIS_HOST = 'localhost';
    process.env.KAFKA_BROKERS = 'localhost:9092';

    app = new App();
    server = app.getApp();
  });

  afterAll(async () => {
    await app.stop();
  });

  describe('Health Endpoints', () => {
    it('GET /health should return 200', async () => {
      const response = await request(server).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('service', 'notification-service');
    });

    it('GET /health/metrics should return metrics', async () => {
      const response = await request(server).get('/health/metrics');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('memory');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('Notification Endpoints', () => {
    it('POST /api/v1/notifications should create notification with valid data', async () => {
      const notificationData = {
        type: 'email',
        recipient: {
          email: 'test@example.com',
          userId: 'user-123'
        },
        payload: {
          subject: 'Test Notification',
          body: 'This is a test notification'
        },
        priority: 'medium'
      };

      const response = await request(server)
        .post('/api/v1/notifications')
        .send(notificationData)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.type).toBe('email');
    });

    it('POST /api/v1/notifications should return 400 for invalid type', async () => {
      const notificationData = {
        type: 'invalid-type',
        recipient: {
          email: 'test@example.com'
        },
        payload: {
          body: 'Test'
        }
      };

      const response = await request(server)
        .post('/api/v1/notifications')
        .send(notificationData)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });

    it('POST /api/v1/notifications should return 400 for missing required fields', async () => {
      const notificationData = {
        type: 'email',
        recipient: {}
      };

      const response = await request(server)
        .post('/api/v1/notifications')
        .send(notificationData)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
    });
  });

  describe('Documentation', () => {
    it('GET / should return service info', async () => {
      const response = await request(server).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('service', 'notification-service');
      expect(response.body).toHaveProperty('documentation', '/api-docs');
    });

    it('GET /api-docs should return Swagger UI', async () => {
      const response = await request(server).get('/api-docs/');

      expect(response.status).toBe(301);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(server).get('/non-existent-route');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });
});
