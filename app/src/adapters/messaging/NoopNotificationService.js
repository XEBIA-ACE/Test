'use strict';

const INotificationService = require('../../domain/ports/INotificationService');
const logger = require('../../infrastructure/logger');

/**
 * No-op implementation of INotificationService.
 * Used in tests and when the message queue is unavailable.
 */
class NoopNotificationService extends INotificationService {
  async sendRegistrationEmail({ userId, email }) {
    logger.debug({ userId, email }, '[NOOP] sendRegistrationEmail');
  }

  async sendVerificationSms({ userId, mobile }) {
    logger.debug({ userId, mobile }, '[NOOP] sendVerificationSms');
  }
}

module.exports = NoopNotificationService;
