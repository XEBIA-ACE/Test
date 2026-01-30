import amqp, { Channel, Connection, ConsumeMessage } from 'amqplib';
import { IMessageBroker, MessageHandler } from '../../application/interfaces/IMessageBroker';
import { Logger } from '../../utils/logger';
import { config } from '../../config/environment';

/**
 * RabbitMQ Message Broker Implementation
 * Alternative message broker implementation using RabbitMQ
 */
export class RabbitMQMessageBroker implements IMessageBroker {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private readonly logger: Logger;
  private readonly handlers: Map<string, MessageHandler>;

  constructor() {
    this.logger = new Logger({ service: 'RabbitMQMessageBroker' });
    this.handlers = new Map();
  }

  async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(config.rabbitmq.url);
      this.channel = await this.connection.createChannel();

      // Declare exchange
      await this.channel.assertExchange(config.rabbitmq.exchange, 'topic', { durable: true });

      this.connection.on('error', (error) => {
        this.logger.error('RabbitMQ connection error', error);
      });

      this.logger.info('RabbitMQ connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.logger.info('RabbitMQ disconnected');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ', error);
      throw error;
    }
  }

  async publish(topic: string, message: Record<string, unknown>): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    try {
      const content = Buffer.from(JSON.stringify(message));

      this.channel.publish(config.rabbitmq.exchange, topic, content, {
        persistent: true,
        timestamp: Date.now(),
        contentType: 'application/json',
      });

      this.logger.debug('Message published to RabbitMQ', { topic, messageId: message.id });
    } catch (error) {
      this.logger.error('Error publishing message to RabbitMQ', { topic, error });
      throw error;
    }
  }

  async subscribe(topic: string, handler: MessageHandler): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    try {
      this.handlers.set(topic, handler);

      // Declare queue
      const queue = `${config.rabbitmq.queue}.${topic}`;
      await this.channel.assertQueue(queue, { durable: true });

      // Bind queue to exchange
      await this.channel.bindQueue(queue, config.rabbitmq.exchange, topic);

      // Consume messages
      await this.channel.consume(
        queue,
        async (msg: ConsumeMessage | null) => {
          if (msg) {
            await this.handleMessage(topic, msg);
          }
        },
        { noAck: false }
      );

      this.logger.info('Subscribed to RabbitMQ queue', { topic, queue });
    } catch (error) {
      this.logger.error('Error subscribing to RabbitMQ queue', { topic, error });
      throw error;
    }
  }

  private async handleMessage(topic: string, msg: ConsumeMessage): Promise<void> {
    if (!this.channel) return;

    try {
      const content = msg.content.toString();
      const parsedMessage = JSON.parse(content);
      const handler = this.handlers.get(topic);

      if (!handler) {
        this.logger.warn('No handler found for topic', { topic });
        this.channel.nack(msg, false, false);
        return;
      }

      await handler(parsedMessage);
      this.channel.ack(msg);
      this.logger.debug('Message processed successfully', { topic });
    } catch (error) {
      this.logger.error('Error handling RabbitMQ message', { topic, error });
      // Requeue message for retry
      this.channel.nack(msg, false, true);
    }
  }
}
