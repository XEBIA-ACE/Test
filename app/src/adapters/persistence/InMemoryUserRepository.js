'use strict';

const IUserRepository = require('../../domain/ports/IUserRepository');

/**
 * In-memory implementation of IUserRepository.
 * Used for unit / integration tests — never in production.
 */
class InMemoryUserRepository extends IUserRepository {
  constructor() {
    super();
    /** @type {Map<string, import('../../domain/entities/User')>} */
    this._store = new Map();
  }

  async save(user) {
    this._store.set(user.id, user);
    return user;
  }

  async findById(id) {
    return this._store.get(id) || null;
  }

  async findByEmail(email) {
    for (const user of this._store.values()) {
      if (user.email === email.toLowerCase().trim()) return user;
    }
    return null;
  }

  async findByMobile(mobile) {
    for (const user of this._store.values()) {
      if (user.mobile === mobile) return user;
    }
    return null;
  }

  async update(user) {
    this._store.set(user.id, user);
    return user;
  }

  async delete(id) {
    this._store.delete(id);
  }

  /** Helper for tests */
  clear() {
    this._store.clear();
  }
}

module.exports = InMemoryUserRepository;
