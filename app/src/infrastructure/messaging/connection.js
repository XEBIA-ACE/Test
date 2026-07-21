'use strict';

const amqplib = require('amqplib');
const logger = require('../logger');

let connection;
let channel;

/**
 * Connect to RabbitMQ and create a durable channel.
 * @returns {Promise<amqplib.Channel>}
 */
async function connectMessageQueue() {
  if (channel) return channel;

  connection = await amqplib.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
  channel = await connection.createChannel();

  const exchange = process.env.RABBITMQ_EXCHANGE || 'user_events';
  await channel.assertExchange(exchange, 'topic', { durable: true });

  const queue = process.env.RABBITMQ_QUEUE_NOTIFICATIONS || 'notifications';
  await channel.assertQueue(queue, { durable: true });
  await channel.bindQueue(queue, exchange, 'user.*');

  connection.on('error', (err) => logger.error({ err }, 'RabbitMQ connection error'));
  connection.on('close', () => logger.warn('RabbitMQ connection closed'));

  return channel;
}

/**
 * Returns the active channel (throws if not yet connected).
 * @returns {amqplib.Channel}
 */
function getChannel() {
  if (!channel) {
    throw new Error('Message queue not connected. Call connectMessageQueue() first.');
  }
  return channel;
}

module.exports = { connectMessageQueue, getChannel };
