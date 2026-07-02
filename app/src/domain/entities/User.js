'use strict';

const { v4: uuidv4 } = require('uuid');

/**
 * User entity — the central aggregate of this service.
 *
 * @property {string}   id
 * @property {string}   email
 * @property {string}   passwordHash
 * @property {string}   firstName
 * @property {string}   lastName
 * @property {string}   role          - 'user' | 'admin'
 * @property {boolean}  isActive
 * @property {Date}     createdAt
 * @property {Date}     updatedAt
 */
class User {
  /**
   * @param {object} props
   * @param {string}  [props.id]
   * @param {string}   props.email
   * @param {string}   props.passwordHash
   * @param {string}   props.firstName
   * @param {string}   props.lastName
   * @param {string}  [props.role]
   * @param {boolean} [props.isActive]
   * @param {Date}    [props.createdAt]
   * @param {Date}    [props.updatedAt]
   */
  constructor({
    id,
    email,
    passwordHash,
    firstName,
    lastName,
    role = 'user',
    isActive = true,
    createdAt,
    updatedAt,
  }) {
    this.id = id || uuidv4();
    this.email = email;
    this.passwordHash = passwordHash;
    this.firstName = firstName;
    this.lastName = lastName;
    this.role = role;
    this.isActive = isActive;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  /**
   * Return a plain object safe to expose via API (no password hash).
   *
   * @returns {object}
   */
  toPublicProfile() {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      role: this.role,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Apply profile updates and bump updatedAt.
   *
   * @param {object} updates
   * @param {string} [updates.firstName]
   * @param {string} [updates.lastName]
   */
  updateProfile({ firstName, lastName }) {
    if (firstName !== undefined) this.firstName = firstName;
    if (lastName !== undefined) this.lastName = lastName;
    this.updatedAt = new Date();
  }

  /**
   * Deactivate the user account.
   */
  deactivate() {
    this.isActive = false;
    this.updatedAt = new Date();
  }
}

module.exports = User;
