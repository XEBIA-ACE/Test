'use strict';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';
process.env.BCRYPT_SALT_ROUNDS = '1';

const request = require('supertest');
const app = require('../src/app');
const container = require('../src/container');

beforeEach(() => {
  container.userRepository.clear();
});

async function registerUser(overrides = {}) {
  return request(app)
    .post('/api/v1/users/register')
    .send({
      email: 'dave@example.com',
      password: 'SecurePass1',
      ...overrides,
    });
}

describe('POST /api/v1/auth/login', () => {
  it('returns 200 and accessToken for valid credentials', async () => {
    await registerUser();

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'dave@example.com', password: 'SecurePass1' });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveProperty('accessToken');
    expect(typeof res.body.data.accessToken).toBe('string');
  });

  it('returns user profile alongside token', async () => {
    await registerUser();

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'dave@example.com', password: 'SecurePass1' });

    expect(res.body.data.user).toHaveProperty('id');
    expect(res.body.data.user.email).toBe('dave@example.com');
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
  });

  it('returns 401 for wrong password', async () => {
    await registerUser();

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'dave@example.com', password: 'WrongPass9' });

    expect(res.statusCode).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('returns 401 for non-existent user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ghost@example.com', password: 'SecurePass1' });

    expect(res.statusCode).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('GET /api/v1/users/:id', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/v1/users/some-id');
    expect(res.statusCode).toBe(401);
  });

  it('returns user data with valid token', async () => {
    await registerUser();

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'dave@example.com', password: 'SecurePass1' });

    const { accessToken, user } = loginRes.body.data;

    const res = await request(app)
      .get(`/api/v1/users/${user.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.id).toBe(user.id);
  });

  it('returns 404 for unknown user id', async () => {
    await registerUser();

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'dave@example.com', password: 'SecurePass1' });

    const { accessToken } = loginRes.body.data;

    const res = await request(app)
      .get('/api/v1/users/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(404);
  });
});
