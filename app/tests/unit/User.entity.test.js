'use strict';

const User = require('../../src/domain/entities/User');

describe('User entity', () => {
  const makeUser = (overrides = {}) =>
    new User({
      email: 'test@example.com',
      passwordHash: '$2b$12$hash',
      ...overrides,
    });

  it('lowercases and trims email', () => {
    const user = makeUser({ email: '  UPPER@EXAMPLE.COM  ' });
    expect(user.email).toBe('upper@example.com');
  });

  it('defaults status to PENDING_VERIFICATION', () => {
    const user = makeUser();
    expect(user.status).toBe(User.STATUS.PENDING_VERIFICATION);
    expect(user.isPendingVerification()).toBe(true);
  });

  it('activate() sets status to ACTIVE', () => {
    const user = makeUser();
    user.activate();
    expect(user.status).toBe(User.STATUS.ACTIVE);
    expect(user.isActive()).toBe(true);
  });

  it('suspend() sets status to SUSPENDED', () => {
    const user = makeUser();
    user.activate();
    user.suspend();
    expect(user.status).toBe(User.STATUS.SUSPENDED);
    expect(user.isActive()).toBe(false);
  });

  it('toPublicJSON() omits passwordHash', () => {
    const user = makeUser();
    const json = user.toPublicJSON();
    expect(json).not.toHaveProperty('passwordHash');
    expect(json).toHaveProperty('id');
    expect(json).toHaveProperty('email');
    expect(json).toHaveProperty('status');
  });

  it('assigns a UUID id when none provided', () => {
    const user = makeUser();
    expect(user.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('accepts an explicit id', () => {
    const id = '123e4567-e89b-12d3-a456-426614174000';
    const user = makeUser({ id });
    expect(user.id).toBe(id);
  });
});
