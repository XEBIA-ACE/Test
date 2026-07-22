'use strict';

/**
 * Port: Notification Service
 *
 * Defines the contract for dispatching user-facing notifications.
 * Concrete implementations live in src/adapters/messaging/.
 *
 * @interface
 */
class INotificationService {
  /**
   * Send a welcome / verification email after registration.
   * @param {object} params
   * @param {string} params.userId
   * @param {string} params.email
   * @param {string} [params.firstName]
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async sendRegistrationEmail(params) {
    throw new Error('INotificationService.sendRegistrationEmail() not implemented');
  }

  /**
   * Send a verification SMS to the user's mobile number.
   * @param {object} params
   * @param {string} params.userId
   * @param {string} params.mobile
   * @param {string} params.verificationCode
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async sendVerificationSms(params) {
    throw new Error('INotificationService.sendVerificationSms() not implemented');
  }
}

module.exports = INotificationService;
