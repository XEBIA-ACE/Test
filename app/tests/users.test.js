'use strict';

const request = require('supertest');
const createApp = require('../../src/infrastructure/http/app');

describe('Users endpoints', () => {
  let app;
  let accessToken;
  let userId;

  const validUser = {
    email: 'charlie@example.com',
    password: 'SecurePass1',
    firstName: 'Charlie',
    lastName: 'Brown',
  };

  beforeAll(async () => {
    app = createApp();

    // Register
    const regRes = await request(app).post('/auth/register').send(validUser);
    userId = regRes.body.data.id;

    // Login to get token
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: validUser.email, password: validUser.password });
    accessToken = loginRes.body.data.accessToken;
  });

  // ── GET /users/:id ─────────────────────────────────────────────────────────
  describe('GET /users/:id', () => {
    it('returns 200 with the user profile for the authenticated owner', async () => {
      const res = await request(app)
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        id: userId,
        email: validUser.email,
      });
    });

    it('returns 401 without a token', async () => {
      const res = await request(app).get(`/users/${userId}`);
      expect(res.status).toBe(401);
    });

    it('returns 403 when accessing another user\'s profile', async () => {
      // Register a second user
      const otherUser = {
        email: 'dave@example.com',
        password: 'SecurePass1',
        firstName: 'Dave',
        lastName: 'Jones',
      };
      const regRes = await request(app).post('/auth/register').send(otherUser);
      const otherUserId = regRes.body.data.id;

      const res = await request(app)
        .get(`/users/${otherUserId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ── PATCH /users/:id ───────────────────────────────────────────────────────
  describe('PATCH /users/:id', () => {
    it('returns 200 and updates the profile', async () => {
      const res = await request(app)
        .patch(`/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ firstName: 'Charles' });

      expect(res.status).toBe(200);
      expect(res.body.data.firstName).toBe('Charles');
    });

    it('returns 401 without a token', async () => {
      const res = await request(app)
        .patch(`/users/${userId}`)
        .send({ firstName: 'Charles' });

      expect(res.status).toBe(401);
    });
  });
});
