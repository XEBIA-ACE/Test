/**
 * Message Broker Interface
 * Abstraction for message queue operations (Kafka, RabbitMQ)
 */
export interface IMessageBroker {
  /**
   * Publishes a message to a topic/queue
   */
  publish(topic: string, message: Record<string, unknown>): Promise<void>;

  /**
   * Subscribes to a topic/queue with a message handler
   */
  subscribe(topic: string, handler: MessageHandler): Promise<void>;

  /**
   * Connects to the message broker
   */
  connect(): Promise<void>;

  /**
   * Disconnects from the message broker
   */
  disconnect(): Promise<void>;
}

export type MessageHandler = (message: Record<string, unknown>) => Promise<void>;
