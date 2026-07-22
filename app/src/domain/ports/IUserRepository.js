'use strict';

/**
 * Port: User Repository
 *
 * Defines the contract that any persistence adapter must fulfil.
 * Concrete implementations live in src/adapters/persistence/.
 *
 * @interface
 */
class IUserRepository {
  /**
   * Persist a new User aggregate.
   * @param {import('../entities/User')} user
   * @returns {Promise<import('../entities/User')>}
   */
  // eslint-disable-next-line no-unused-vars
  async save(user) {
    throw new Error('IUserRepository.save() not implemented');
  }

  /**
   * Find a user by their UUID.
   * @param {string} id
   * @returns {Promise<import('../entities/User') | null>}
   */
  // eslint-disable-next-line no-unused-vars
  async findById(id) {
    throw new Error('IUserRepository.findById() not implemented');
  }

  /**
   * Find a user by email address (case-insensitive).
   * @param {string} email
   * @returns {Promise<import('../entities/User') | null>}
   */
  // eslint-disable-next-line no-unused-vars
  async findByEmail(email) {
    throw new Error('IUserRepository.findByEmail() not implemented');
  }

  /**
   * Find a user by mobile number.
   * @param {string} mobile
   * @returns {Promise<import('../entities/User') | null>}
   */
  // eslint-disable-next-line no-unused-vars
  async findByMobile(mobile) {
    throw new Error('IUserRepository.findByMobile() not implemented');
  }

  /**
   * Persist updates to an existing User aggregate.
   * @param {import('../entities/User')} user
   * @returns {Promise<import('../entities/User')>}
   */
  // eslint-disable-next-line no-unused-vars
  async update(user) {
    throw new Error('IUserRepository.update() not implemented');
  }

  /**
   * Soft-delete a user record.
   * @param {string} id
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async delete(id) {
    throw new Error('IUserRepository.delete() not implemented');
  }
}

module.exports = IUserRepository;
