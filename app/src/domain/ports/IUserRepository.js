'use strict';

/**
 * IUserRepository — outbound port (driven side).
 *
 * Defines the persistence contract that the domain requires.
 * Concrete adapters (in-memory, PostgreSQL, MongoDB, …) must implement
 * every method listed here.
 *
 * This file is intentionally abstract — it documents the interface via
 * JSDoc and throws if a subclass forgets to override a method.
 */
class IUserRepository {
  /**
   * Persist a new User entity.
   *
   * @param {import('../entities/User')} user
   * @returns {Promise<import('../entities/User')>} The saved user
   */
  // eslint-disable-next-line no-unused-vars
  async save(user) {
    throw new Error('IUserRepository.save() must be implemented');
  }

  /**
   * Find a user by their unique identifier.
   *
   * @param {string} id
   * @returns {Promise<import('../entities/User') | null>}
   */
  // eslint-disable-next-line no-unused-vars
  async findById(id) {
    throw new Error('IUserRepository.findById() must be implemented');
  }

  /**
   * Find a user by their e-mail address.
   *
   * @param {string} email - Normalised (lowercase) e-mail
   * @returns {Promise<import('../entities/User') | null>}
   */
  // eslint-disable-next-line no-unused-vars
  async findByEmail(email) {
    throw new Error('IUserRepository.findByEmail() must be implemented');
  }

  /**
   * Persist changes to an existing user.
   *
   * @param {import('../entities/User')} user
   * @returns {Promise<import('../entities/User')>}
   */
  // eslint-disable-next-line no-unused-vars
  async update(user) {
    throw new Error('IUserRepository.update() must be implemented');
  }

  /**
   * Remove a user by id.
   *
   * @param {string} id
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async deleteById(id) {
    throw new Error('IUserRepository.deleteById() must be implemented');
  }
}

module.exports = IUserRepository;
