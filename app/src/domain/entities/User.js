'use strict';

const { v4: uuidv4 } = require('uuid');

/**
 * @typedef {'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'DELETED'} UserStatus
 */

/**
 * User aggregate root.
 * Contains pure business logic — no I/O, no framework dependencies.
 */
class User {
  /**
   * @param {object} props
   * @param {string} [props.id]
   * @param {string} props.email
   * @param {string} [props.mobile]
   * @param {string} props.passwordHash
   * @param {string} [props.firstName]
   * @param {string} [props.lastName]
   * @param {UserStatus} [props.status]
   * @param {string} [props.oauthProvider]
   * @param {string} [props.oauthSubject]
   * @param {Date} [props.createdAt]
   * @param {Date} [props.updatedAt]
   */
  constructor({
    id,
    email,
    mobile,
    passwordHash,
    firstName,
    lastName,
    status,
    oauthProvider,
    oauthSubject,
    createdAt,
    updatedAt,
  }) {
    this.id = id || uuidv4();
    this.email = email.toLowerCase().trim();
    this.mobile = mobile || null;
    this.passwordHash = passwordHash;
    this.firstName = firstName || null;
    this.lastName = lastName || null;
    this.status = status || User.STATUS.PENDING_VERIFICATION;
    this.oauthProvider = oauthProvider || null;
    this.oauthSubject = oauthSubject || null;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  /** @returns {boolean} */
  isActive() {
    return this.status === User.STATUS.ACTIVE;
  }

  /** @returns {boolean} */
  isPendingVerification() {
    return this.status === User.STATUS.PENDING_VERIFICATION;
  }

  activate() {
    this.status = User.STATUS.ACTIVE;
    this.updatedAt = new Date();
  }

  suspend() {
    this.status = User.STATUS.SUSPENDED;
    this.updatedAt = new Date();
  }

  /** @returns {object} Safe public representation (no passwordHash) */
  toPublicJSON() {
    return {
      id: this.id,
      email: this.email,
      mobile: this.mobile,
      firstName: this.firstName,
      lastName: this.lastName,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static get STATUS() {
    return Object.freeze({
      PENDING_VERIFICATION: 'PENDING_VERIFICATION',
      ACTIVE: 'ACTIVE',
      SUSPENDED: 'SUSPENDED',
      DELETED: 'DELETED',
    });
  }
}

module.exports = User;
