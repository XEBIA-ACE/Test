'use strict';

const Email = require('../../src/domain/value-objects/Email');
const Password = require('../../src/domain/value-objects/Password');
const User = require('../../src/domain/entities/User');
const { ValidationError } = require('../../src/domain/errors/DomainError');

describe('Email value object', () => {
  it('normalises to lowercase', () => {
    const email = new Email('Alice@Example.COM');
    expect(email.value).toBe('alice@example.com');
  });

  it('throws ValidationError for invalid email', () => {
    expect(() => new Email('not-an-email')).toThrow(ValidationError);
  });

  it('throws ValidationError for empty string', () => {
    expect(() => new Email('')).toThrow(ValidationError);
  });

  it('equals() returns true for same address', () => {
    const a = new Email('test@example.com');
    const b = new Email('TEST@EXAMPLE.COM');
    expect(a.equals(b)).toBe(true);
  });
});

describe('Password value object', () => {
  it('fromRaw() accepts a strong password', () => {
    const p = Password.fromRaw('StrongPass1');
    expect(p.raw).toBe('StrongPass1');
  });

  it('fromRaw() throws when password is too short', () => {
    expect(() => Password.fromRaw('Sh0rt')).toThrow(ValidationError);
  });

  it('fromRaw() throws when no uppercase letter', () => {
    expect(() => Password.fromRaw('weakpass1')).toThrow(ValidationError);
  });

  it('fromRaw() throws when no digit', () => {
    expect(() => Password.fromRaw('NoDigitPass')).toThrow(ValidationError);
  });

  it('fromHash() stores the hash', () => {
    const p = Password.fromHash('$2b$12$somehash');
    expect(p.hash).toBe('$2b$12$somehash');
  });
});

describe('User entity', () => {
  const makeUser = (overrides = {}) =>
    new User({
      email: 'user@example.com',
      passwordHash: '$2b$12$hash',
      firstName: 'John',
      lastName: 'Doe',
      ...overrides,
    });

  it('assigns a UUID id on creation', () => {
    const user = makeUser();
    expect(user.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });

  it('defaults role to "user"', () => {
    expect(makeUser().role).toBe('user');
  });

  it('defaults isActive to true', () => {
    expect(makeUser().isActive).toBe(true);
  });

  it('toPublicProfile() omits passwordHash', () => {
    const profile = makeUser().toPublicProfile();
    expect(profile).not.toHaveProperty('passwordHash');
    expect(profile).toHaveProperty('email');
    expect(profile).toHaveProperty('firstName');
  });

  it('updateProfile() updates firstName and lastName', () => {
    const user = makeUser();
    user.updateProfile({ firstName: 'Jane', lastName: 'Smith' });
    expect(user.firstName).toBe('Jane');
    expect(user.lastName).toBe('Smith');
  });
});
