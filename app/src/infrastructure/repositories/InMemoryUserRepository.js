'use strict';

const IUserRepository = require('../../domain/ports/IUserRepository');

/**
 * InMemoryUserRepository — driven adapter.
 *
 * Stores users in a plain Map.  Suitable for development, testing, and
 * as a reference implementation.  Replace with a database-backed adapter
 * in production.
 *
 * @implements {IUserRepository}
 */
class InMemoryUserRepository extends IUserRepository {
  constructor() {
    super();
    /** @type {Map<string, import('../../domain/entities/User')>} */
    this._store = new Map();
  }

  /**
   * @param {import('../../domain/entities/User')} user
   * @returns {Promise<import('../../domain/entities/User')>}
   */
  async save(user) {
    this._store.set(user.id, user);
    return user;
  }

  /**
   * @param {string} id
   * @returns {Promise<import('../../domain/entities/User') | null>}
   */
  async findById(id) {
    return this._store.get(id) || null;
  }

  /**
   * @param {string} email - Normalised (lowercase) e-mail
   * @returns {Promise<import('../../domain/entities/User') | null>}
   */
  async findByEmail(email) {
    for (const user of this._store.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  /**
   * @param {import('../../domain/entities/User')} user
   * @returns {Promise<import('../../domain/entities/User')>}
   */
  async update(user) {
    if (!this._store.has(user.id)) {
      throw new Error(`User "${user.id}" not found in store`);
    }
    this._store.set(user.id, user);
    return user;
  }

  /**
   * @param {string} id
   * @returns {Promise<void>}
   */
  async deleteById(id) {
    this._store.delete(id);
  }

  /**
   * Utility for tests — wipe all records.
   */
  clear() {
    this._store.clear();
  }
}

module.exports = InMemoryUserRepository;
