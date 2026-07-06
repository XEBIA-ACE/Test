// RabbitMQ adapter implementing EventPublisher port

import { Injectable, Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { EventPublisher } from '../../../domain/ports/event-publisher.port';
import { DomainEvent } from '../../../domain/events/project.events';

@Injectable()
export class RabbitMQEventPublisher implements EventPublisher {
  private readonly logger = new Logger(RabbitMQEventPublisher.name);
  private readonly exchange = 'project.events';

  constructor(private readonly amqpConnection: AmqpConnection) {}

  async publish(event: DomainEvent): Promise<void> {
    try {
      await this.amqpConnection.publish(this.exchange, event.eventType, event);
      this.logger.log(`Published event: ${event.eventType}`);
    } catch (err) {
      this.logger.error(`Failed to publish event ${event.eventType}: ${err}`);
      throw err;
    }
  }
}
