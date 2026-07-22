'use strict';

process.env.NODE_ENV = 'test';
process.env.BCRYPT_SALT_ROUNDS = '1';

const RegisterUser = require('../../src/application/usecases/RegisterUser');
const InMemoryUserRepository = require('../../src/adapters/persistence/InMemoryUserRepository');
const BcryptPasswordHasher = require('../../src/adapters/security/BcryptPasswordHasher');
const NoopNotificationService = require('../../src/adapters/messaging/NoopNotificationService');
const { UserAlreadyExistsError, ValidationError } = require('../../src/domain/errors/DomainError');
const User = require('../../src/domain/entities/User');

function makeUseCase() {
  const userRepository = new InMemoryUserRepository();
  const passwordHasher = new BcryptPasswordHasher();
  const notificationService = new NoopNotificationService();
  const useCase = new RegisterUser({ userRepository, passwordHasher, notificationService });
  return { useCase, userRepository };
}

describe('RegisterUser use-case', () => {
  it('creates and returns a User entity', async () => {
    const { useCase } = makeUseCase();
    const user = await useCase.execute({ email: 'alice@example.com', password: 'SecurePass1' });

    expect(user).toBeInstanceOf(User);
    expect(user.email).toBe('alice@example.com');
  });

  it('hashes the password (does not store plaintext)', async () => {
    const { useCase } = makeUseCase();
    const user = await useCase.execute({ email: 'alice@example.com', password: 'SecurePass1' });

    expect(user.passwordHash).not.toBe('SecurePass1');
    expect(user.passwordHash.length).toBeGreaterThan(20);
  });

  it('throws ValidationError when email is missing', async () => {
    const { useCase } = makeUseCase();
    await expect(useCase.execute({ password: 'SecurePass1' })).rejects.toThrow(ValidationError);
  });

  it('throws UserAlreadyExistsError on duplicate email', async () => {
    const { useCase } = makeUseCase();
    await useCase.execute({ email: 'alice@example.com', password: 'SecurePass1' });
    await expect(
      useCase.execute({ email: 'alice@example.com', password: 'AnotherPass1' })
    ).rejects.toThrow(UserAlreadyExistsError);
  });

  it('throws UserAlreadyExistsError on duplicate mobile', async () => {
    const { useCase } = makeUseCase();
    await useCase.execute({ email: 'alice@example.com', password: 'SecurePass1', mobile: '+15551234567' });
    await expect(
      useCase.execute({ email: 'bob@example.com', password: 'SecurePass1', mobile: '+15551234567' })
    ).rejects.toThrow(UserAlreadyExistsError);
  });

  it('persists user to repository', async () => {
    const { useCase, userRepository } = makeUseCase();
    const user = await useCase.execute({ email: 'alice@example.com', password: 'SecurePass1' });

    const found = await userRepository.findById(user.id);
    expect(found).not.toBeNull();
    expect(found.email).toBe('alice@example.com');
  });
});
