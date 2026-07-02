'use strict';

const { NotFoundError, ForbiddenError } = require('../../domain/errors/DomainError');

/**
 * UpdateUserProfile use-case.
 *
 * Allows a user to update their own profile (or an admin to update any profile).
 */
class UpdateUserProfile {
  /**
   * @param {import('../../domain/ports/IUserRepository')} userRepository
   */
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  /**
   * @param {object} dto
   * @param {string} dto.targetUserId
   * @param {string} dto.requesterId
   * @param {string} dto.requesterRole
   * @param {string} [dto.firstName]
   * @param {string} [dto.lastName]
   * @returns {Promise<object>} Updated public profile
   * @throws {ForbiddenError}
   * @throws {NotFoundError}
   */
  async execute({ targetUserId, requesterId, requesterRole, firstName, lastName }) {
    if (requesterRole !== 'admin' && targetUserId !== requesterId) {
      throw new ForbiddenError('You are not allowed to update this profile');
    }

    const user = await this.userRepository.findById(targetUserId);
    if (!user) {
      throw new NotFoundError(`User "${targetUserId}" not found`);
    }

    user.updateProfile({ firstName, lastName });
    const updated = await this.userRepository.update(user);
    return updated.toPublicProfile();
  }
}

module.exports = UpdateUserProfile;
