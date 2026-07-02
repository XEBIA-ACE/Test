'use strict';

const request = require('supertest');
const createApp = require('../../src/infrastructure/http/app');

describe('Auth endpoints', () => {
  let app;

  const validUser = {
    email: 'alice@example.com',
    password: 'SecurePass1',
    firstName: 'Alice',
    lastName: 'Smith',
  };

  beforeAll(() => {
    app = createApp();
  });

  // ── Register ───────────────────────────────────────────────────────────────
  describe('POST /auth/register', () => {
    it('creates a new user and returns 201', async () => {
      const res = await request(app).post('/auth/register').send(validUser);

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({
        email: validUser.email,
        firstName: validUser.firstName,
        lastName: validUser.lastName,
      });
      expect(res.body.data).not.toHaveProperty('passwordHash');
    });

    it('returns 409 when email is already registered', async () => {
      // First registration
      await request(app).post('/auth/register').send(validUser);
      // Duplicate
      const res = await request(app).post('/auth/register').send(validUser);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('returns 422 when email is invalid', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ ...validUser, email: 'not-an-email' });

      expect(res.status).toBe(422);
    });

    it('returns 422 when password is too short', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ ...validUser, email: 'bob@example.com', password: 'short' });

      expect(res.status).toBe(422);
    });
  });

  // ── Login ──────────────────────────────────────────────────────────────────
  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Ensure the user exists before each login test
      await request(app).post('/auth/register').send(validUser);
    });

    it('returns 200 with tokens on valid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: validUser.email, password: validUser.password });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data).toHaveProperty('user');
    });

    it('returns 401 on wrong password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: validUser.email, password: 'WrongPass1' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 401 on unknown email', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'nobody@example.com', password: 'SecurePass1' });

      expect(res.status).toBe(401);
    });
  });
});
