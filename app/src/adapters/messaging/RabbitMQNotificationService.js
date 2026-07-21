'use strict';

const INotificationService = require('../../domain/ports/INotificationService');
const logger = require('../../infrastructure/logger');

/**
 * RabbitMQ implementation of INotificationService.
 * Publishes events to the user_events exchange; a downstream consumer
 * (email/SMS gateway) handles actual delivery.
 */
class RabbitMQNotificationService extends INotificationService {
  /**
   * @param {import('amqplib').Channel} channel
   */
  constructor(channel) {
    super();
    this.channel = channel;
    this.exchange = process.env.RABBITMQ_EXCHANGE || 'user_events';
  }

  /**
   * @param {object} params
   * @param {string} params.userId
   * @param {string} params.email
   * @param {string} [params.firstName]
   * @returns {Promise<void>}
   */
  async sendRegistrationEmail({ userId, email, firstName }) {
    const payload = JSON.stringify({ type: 'USER_REGISTERED', userId, email, firstName, ts: new Date() });
    this.channel.publish(this.exchange, 'user.registered', Buffer.from(payload), { persistent: true });
    logger.info({ userId }, 'Registration email event published');
  }

  /**
   * @param {object} params
   * @param {string} params.userId
   * @param {string} params.mobile
   * @param {string} params.verificationCode
   * @returns {Promise<void>}
   */
  async sendVerificationSms({ userId, mobile, verificationCode }) {
    const payload = JSON.stringify({
      type: 'USER_VERIFICATION_SMS',
      userId,
      mobile,
      verificationCode,
      ts: new Date(),
    });
    this.channel.publish(this.exchange, 'user.verification_sms', Buffer.from(payload), {
      persistent: true,
    });
    logger.info({ userId }, 'Verification SMS event published');
  }
}

module.exports = RabbitMQNotificationService;
