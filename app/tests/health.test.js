'use strict';

const request = require('supertest');
const createApp = require('../../src/infrastructure/http/app');

describe('Health endpoint', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  it('GET /health → 200 with status ok', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'ok',
      service: 'user-management-service',
    });
    expect(typeof res.body.timestamp).toBe('string');
  });

  it('GET /health → response contains a valid ISO timestamp', async () => {
    const res = await request(app).get('/health');
    const ts = new Date(res.body.timestamp);
    expect(ts.toString()).not.toBe('Invalid Date');
  });
});
