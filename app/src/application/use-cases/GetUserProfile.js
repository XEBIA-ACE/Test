'use strict';

const { NotFoundError, ForbiddenError } = require('../../domain/errors/DomainError');

/**
 * GetUserProfile use-case.
 *
 * Retrieves the public profile of a user.
 * A user may only fetch their own profile unless they are an admin.
 */
class GetUserProfile {
  /**
   * @param {import('../../domain/ports/IUserRepository')} userRepository
   */
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  /**
   * @param {object} dto
   * @param {string} dto.targetUserId  - ID of the user whose profile is requested
   * @param {string} dto.requesterId   - ID of the authenticated caller
   * @param {string} dto.requesterRole - Role of the authenticated caller
   * @returns {Promise<object>} Public profile
   * @throws {ForbiddenError} if caller is not allowed to view the profile
   * @throws {NotFoundError}  if the user does not exist
   */
  async execute({ targetUserId, requesterId, requesterRole }) {
    if (requesterRole !== 'admin' && targetUserId !== requesterId) {
      throw new ForbiddenError('You are not allowed to view this profile');
    }

    const user = await this.userRepository.findById(targetUserId);
    if (!user) {
      throw new NotFoundError(`User "${targetUserId}" not found`);
    }

    return user.toPublicProfile();
  }
}

module.exports = GetUserProfile;
