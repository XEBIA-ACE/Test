import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqplib from 'amqplib';
import { v4 as uuidv4 } from 'uuid';
import { ProcessProjectEventUseCase } from '../../../application/use-cases/process-project-event.use-case';
import { ProjectEvent } from '../../../domain/entities/project-event.entity';
import { ProjectEventType } from '../../../domain/enums/project-event-type.enum';
import { DuplicateEventError, PermanentDeliveryError } from '../../../domain/errors/domain.errors';

interface RawProjectEvent {
  eventId?: string;
  eventType: string;
  occurredAt?: string;
  projectId: string;
  projectName: string;
  userId: string;
  recipientAddress: string;
  payload?: Record<string, unknown>;
}

@Injectable()
export class RabbitMQConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQConsumer.name);
  private connection: amqplib.Connection | null = null;
  private channel: amqplib.Channel | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly processEventUseCase: ProcessProjectEventUseCase,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    const url = this.configService.get<string>('app.rabbitmq.url')!;
    const exchange = this.configService.get<string>('app.rabbitmq.exchange')!;
    const queue = this.configService.get<string>('app.rabbitmq.queue')!;
    const dlq = this.configService.get<string>('app.rabbitmq.deadLetterQueue')!;
    const prefetch = this.configService.get<number>('app.rabbitmq.prefetch')!;

    try {
      this.connection = await amqplib.connect(url);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(exchange, 'topic', { durable: true });

      // Dead-letter queue
      await this.channel.assertQueue(dlq, { durable: true });

      // Main queue with DLQ routing
      await this.channel.assertQueue(queue, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': '',
          'x-dead-letter-routing-key': dlq,
        },
      });

      // Bind to all project event routing keys
      for (const eventType of Object.values(ProjectEventType)) {
        await this.channel.bindQueue(queue, exchange, eventType);
      }

      await this.channel.prefetch(prefetch);

      await this.channel.consume(queue, (msg) => this.handleMessage(msg));
      this.logger.log(`RabbitMQ consumer started on queue "${queue}"`);
    } catch (err) {
      this.logger.error('Failed to connect to RabbitMQ', err);
      // TODO: implement reconnection strategy
    }
  }

  private async handleMessage(msg: amqplib.ConsumeMessage | null): Promise<void> {
    if (!msg) return;

    let raw: RawProjectEvent;
    try {
      raw = JSON.parse(msg.content.toString()) as RawProjectEvent;
    } catch {
      this.logger.error('Failed to parse message — sending to DLQ');
      this.channel?.nack(msg, false, false);
      return;
    }

    const event = new ProjectEvent({
      eventId: raw.eventId ?? uuidv4(),
      eventType: raw.eventType as ProjectEventType,
      occurredAt: raw.occurredAt ?? new Date().toISOString(),
      projectId: raw.projectId,
      projectName: raw.projectName,
      payload: raw.payload,
    });

    try {
      await this.processEventUseCase.execute(event, raw.userId, raw.recipientAddress);
      this.channel?.ack(msg);
    } catch (err) {
      if (err instanceof DuplicateEventError) {
        // Already processed — ack to remove from queue
        this.channel?.ack(msg);
        return;
      }

      if (err instanceof PermanentDeliveryError) {
        this.logger.error(`Permanent failure — routing to DLQ: ${event.eventId}`);
        this.channel?.nack(msg, false, false);
        return;
      }

      // Transient / unknown — requeue once, then DLQ
      this.logger.warn(`Transient failure — requeuing: ${event.eventId}`);
      this.channel?.nack(msg, false, true);
    }
  }

  private async disconnect(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch {
      // Ignore errors during shutdown
    }
  }
}
