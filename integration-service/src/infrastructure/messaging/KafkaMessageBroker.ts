import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';
import { IMessageBroker, MessageHandler } from '../../application/interfaces/IMessageBroker';
import { Logger } from '../../utils/logger';
import { config } from '../../config/environment';

/**
 * Kafka Message Broker Implementation
 * Handles pub/sub messaging using Apache Kafka
 */
export class KafkaMessageBroker implements IMessageBroker {
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private readonly logger: Logger;
  private readonly handlers: Map<string, MessageHandler>;

  constructor() {
    this.logger = new Logger({ service: 'KafkaMessageBroker' });
    this.handlers = new Map();

    this.kafka = new Kafka({
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers,
      retry: {
        retries: 5,
        initialRetryTime: 300,
      },
    });

    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: config.kafka.groupId });
  }

  async connect(): Promise<void> {
    try {
      await this.producer.connect();
      await this.consumer.connect();
      this.logger.info('Kafka connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to Kafka', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.producer.disconnect();
      await this.consumer.disconnect();
      this.logger.info('Kafka disconnected');
    } catch (error) {
      this.logger.error('Error disconnecting from Kafka', error);
      throw error;
    }
  }

  async publish(topic: string, message: Record<string, unknown>): Promise<void> {
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: message.id as string || Date.now().toString(),
            value: JSON.stringify(message),
            timestamp: Date.now().toString(),
          },
        ],
      });

      this.logger.debug('Message published to Kafka', { topic, messageId: message.id });
    } catch (error) {
      this.logger.error('Error publishing message to Kafka', { topic, error });
      throw error;
    }
  }

  async subscribe(topic: string, handler: MessageHandler): Promise<void> {
    try {
      this.handlers.set(topic, handler);

      await this.consumer.subscribe({ topic, fromBeginning: false });

      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });

      this.logger.info('Subscribed to Kafka topic', { topic });
    } catch (error) {
      this.logger.error('Error subscribing to Kafka topic', { topic, error });
      throw error;
    }
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, message } = payload;

    try {
      if (!message.value) {
        this.logger.warn('Received empty message', { topic });
        return;
      }

      const parsedMessage = JSON.parse(message.value.toString());
      const handler = this.handlers.get(topic);

      if (!handler) {
        this.logger.warn('No handler found for topic', { topic });
        return;
      }

      await handler(parsedMessage);
      this.logger.debug('Message processed successfully', { topic });
    } catch (error) {
      this.logger.error('Error handling Kafka message', { topic, error });
      // Implement dead letter queue logic here
    }
  }
}
