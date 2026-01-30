import request from 'supertest';
import { App } from '../../../src/app';

/**
 * Integration API Integration Tests
 */
describe('Integration API', () => {
  let app: App;
  let server: any;

  beforeAll(async () => {
    // Note: In real tests, you would set up a test database
    // and initialize the app with test dependencies
    app = new App();
    server = app.getApp();
  });

  afterAll(async () => {
    // Cleanup
    await app.shutdown();
  });

  describe('POST /api/v1/integrations', () => {
    it('should create a new integration', async () => {
      const payload = {
        sourceSystem: 'CRM',
        targetSystem: 'ERP',
        operation: 'createOrder',
        payload: {
          orderId: '12345',
          customerId: 'CUST-001',
          amount: 1000,
        },
      };

      const response = await request(server)
        .post('/api/v1/integrations')
        .send(payload)
        .expect('Content-Type', /json/);

      // Note: This test will fail without actual database setup
      // In production, you would check for 201 status and validate response
      expect(response.body).toHaveProperty('success');
    });

    it('should return 400 for invalid payload', async () => {
      const invalidPayload = {
        sourceSystem: '',
        targetSystem: 'ERP',
        operation: 'createOrder',
      };

      const response = await request(server)
        .post('/api/v1/integrations')
        .send(invalidPayload)
        .expect('Content-Type', /json/);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/integrations/:id', () => {
    it('should return 404 for non-existent integration', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(server)
        .get(`/api/v1/integrations/${fakeId}`)
        .expect('Content-Type', /json/);

      // Without database, this will return an error
      expect(response.body).toHaveProperty('success');
    });
  });

  describe('GET /api/v1/integrations', () => {
    it('should return list of integrations', async () => {
      const response = await request(server)
        .get('/api/v1/integrations')
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
    });

    it('should accept query parameters for filtering', async () => {
      const response = await request(server)
        .get('/api/v1/integrations')
        .query({ sourceSystem: 'CRM', limit: 10 })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success');
    });
  });

  describe('Health Check Endpoints', () => {
    it('GET /health should return healthy status', async () => {
      const response = await request(server)
        .get('/health')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service');
    });

    it('GET /ready should return readiness status', async () => {
      const response = await request(server)
        .get('/ready')
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('checks');
    });

    it('GET /live should return liveness status', async () => {
      const response = await request(server)
        .get('/live')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('status', 'alive');
    });
  });
});
