'use strict';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';

const request = require('supertest');
const app = require('../src/app');

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('includes service name in response', async () => {
    const res = await request(app).get('/health');

    expect(res.body).toHaveProperty('service');
    expect(typeof res.body.service).toBe('string');
  });

  it('includes a valid ISO timestamp', async () => {
    const res = await request(app).get('/health');

    expect(res.body).toHaveProperty('timestamp');
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
  });

  it('includes uptime as a number', async () => {
    const res = await request(app).get('/health');

    expect(res.body).toHaveProperty('uptime');
    expect(typeof res.body.uptime).toBe('number');
  });

  it('returns Content-Type application/json', async () => {
    const res = await request(app).get('/health');

    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});
