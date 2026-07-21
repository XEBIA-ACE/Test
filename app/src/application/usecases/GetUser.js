'use strict';

const { UserNotFoundError } = require('../../domain/errors/DomainError');

/**
 * Use-case: Retrieve a user account by ID.
 */
class GetUser {
  /**
   * @param {object} deps
   * @param {import('../../domain/ports/IUserRepository')} deps.userRepository
   */
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  /**
   * @param {object} query
   * @param {string} query.userId
   * @returns {Promise<import('../../domain/entities/User')>}
   */
  async execute({ userId }) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }
    return user;
  }
}

module.exports = GetUser;
