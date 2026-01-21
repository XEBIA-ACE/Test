import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';
import { IMessageQueue } from '../../domain/interfaces/IMessageQueue';
import { logger } from '../logging/logger';

export interface KafkaConfig {
  brokers: string[];
  clientId: string;
  groupId: string;
}

export class KafkaService implements IMessageQueue {
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private handlers: Map<string, (message: any) => Promise<void>> = new Map();
  private connected = false;

  constructor(private readonly config: KafkaConfig) {
    this.kafka = new Kafka({
      clientId: config.clientId,
      brokers: config.brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });

    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: config.groupId });
  }

  async connect(): Promise<void> {
    try {
      await this.producer.connect();
      await this.consumer.connect();
      this.connected = true;

      logger.info({ brokers: this.config.brokers }, 'Kafka connected');

      // Start consuming messages
      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        }
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to connect to Kafka');
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.producer.disconnect();
      await this.consumer.disconnect();
      this.connected = false;
      logger.info('Kafka disconnected');
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error disconnecting from Kafka');
      throw error;
    }
  }

  async publish(topic: string, message: any): Promise<void> {
    if (!this.connected) {
      throw new Error('Kafka not connected');
    }

    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: message.id || Date.now().toString(),
            value: JSON.stringify(message),
            timestamp: Date.now().toString()
          }
        ]
      });

      logger.debug({ topic, messageId: message.id }, 'Message published to Kafka');
    } catch (error: any) {
      logger.error({ topic, error: error.message }, 'Failed to publish message to Kafka');
      throw error;
    }
  }

  async subscribe(topic: string, handler: (message: any) => Promise<void>): Promise<void> {
    if (!this.connected) {
      throw new Error('Kafka not connected');
    }

    try {
      await this.consumer.subscribe({ topic, fromBeginning: false });
      this.handlers.set(topic, handler);

      logger.info({ topic }, 'Subscribed to Kafka topic');
    } catch (error: any) {
      logger.error({ topic, error: error.message }, 'Failed to subscribe to Kafka topic');
      throw error;
    }
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;

    try {
      const handler = this.handlers.get(topic);

      if (!handler) {
        logger.warn({ topic }, 'No handler registered for topic');
        return;
      }

      const value = message.value?.toString();
      if (!value) {
        logger.warn({ topic }, 'Received empty message');
        return;
      }

      const parsedMessage = JSON.parse(value);

      logger.debug({ topic, partition, offset: message.offset }, 'Processing Kafka message');

      await handler(parsedMessage);

      logger.debug({ topic, partition, offset: message.offset }, 'Kafka message processed successfully');
    } catch (error: any) {
      logger.error(
        { topic, partition, offset: message.offset, error: error.message },
        'Error processing Kafka message'
      );

      // Implement dead letter queue logic here if needed
      if (this.shouldSendToDLQ(error)) {
        await this.sendToDeadLetterQueue(topic, message, error);
      }
    }
  }

  private shouldSendToDLQ(error: any): boolean {
    // Add logic to determine if message should go to DLQ
    return true;
  }

  private async sendToDeadLetterQueue(topic: string, message: any, error: any): Promise<void> {
    try {
      const dlqTopic = `${topic}-dlq`;
      await this.producer.send({
        topic: dlqTopic,
        messages: [
          {
            key: message.key?.toString() || Date.now().toString(),
            value: message.value?.toString() || '',
            headers: {
              'original-topic': topic,
              'error-message': error.message || 'Unknown error',
              'failed-at': new Date().toISOString()
            }
          }
        ]
      });

      logger.info({ topic, dlqTopic }, 'Message sent to dead letter queue');
    } catch (dlqError: any) {
      logger.error({ error: dlqError.message }, 'Failed to send message to DLQ');
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}
