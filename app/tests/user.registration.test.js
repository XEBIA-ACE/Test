'use strict';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';
process.env.BCRYPT_SALT_ROUNDS = '1'; // Fast hashing in tests

const request = require('supertest');
const app = require('../src/app');
const container = require('../src/container');

beforeEach(() => {
  // Reset in-memory store between tests
  container.userRepository.clear();
});

describe('POST /api/v1/users/register', () => {
  const validPayload = {
    email: 'alice@example.com',
    password: 'SecurePass1',
    firstName: 'Alice',
    lastName: 'Smith',
  };

  it('registers a new user and returns 201', async () => {
    const res = await request(app)
      .post('/api/v1/users/register')
      .send(validPayload);

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.email).toBe('alice@example.com');
  });

  it('does not expose passwordHash in response', async () => {
    const res = await request(app)
      .post('/api/v1/users/register')
      .send(validPayload);

    expect(res.body.data).not.toHaveProperty('passwordHash');
    expect(res.body.data).not.toHaveProperty('password_hash');
  });

  it('returns PENDING_VERIFICATION status after registration', async () => {
    const res = await request(app)
      .post('/api/v1/users/register')
      .send(validPayload);

    expect(res.body.data.status).toBe('PENDING_VERIFICATION');
  });

  it('rejects duplicate email with 409', async () => {
    await request(app).post('/api/v1/users/register').send(validPayload);
    const res = await request(app).post('/api/v1/users/register').send(validPayload);

    expect(res.statusCode).toBe(409);
    expect(res.body.code).toBe('USER_ALREADY_EXISTS');
  });

  it('rejects missing email with 422', async () => {
    const res = await request(app)
      .post('/api/v1/users/register')
      .send({ password: 'SecurePass1' });

    expect(res.statusCode).toBe(422);
  });

  it('rejects invalid email format with 422', async () => {
    const res = await request(app)
      .post('/api/v1/users/register')
      .send({ email: 'not-an-email', password: 'SecurePass1' });

    expect(res.statusCode).toBe(422);
  });

  it('rejects weak password (too short) with 422', async () => {
    const res = await request(app)
      .post('/api/v1/users/register')
      .send({ email: 'bob@example.com', password: 'short' });

    expect(res.statusCode).toBe(422);
  });

  it('rejects password without uppercase letter with 422', async () => {
    const res = await request(app)
      .post('/api/v1/users/register')
      .send({ email: 'bob@example.com', password: 'alllowercase1' });

    expect(res.statusCode).toBe(422);
  });

  it('accepts optional mobile field', async () => {
    const res = await request(app)
      .post('/api/v1/users/register')
      .send({ ...validPayload, email: 'carol@example.com', mobile: '+15551234567' });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.mobile).toBe('+15551234567');
  });
});
