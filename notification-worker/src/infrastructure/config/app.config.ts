import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',

  rabbitmq: {
    url: process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672',
    exchange: process.env.RABBITMQ_EXCHANGE ?? 'project.events',
    queue: process.env.RABBITMQ_QUEUE ?? 'notification-worker',
    deadLetterQueue: process.env.RABBITMQ_DLQ ?? 'notification-worker.dlq',
    prefetch: parseInt(process.env.RABBITMQ_PREFETCH ?? '10', 10),
  },

  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY ?? '',
    fromEmail: process.env.SENDGRID_FROM_EMAIL ?? 'noreply@example.com',
    fromName: process.env.SENDGRID_FROM_NAME ?? 'Notification Worker',
  },

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID ?? '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? '',
    privateKey: (process.env.FIREBASE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
  },

  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD ?? '',
    ttlSeconds: parseInt(process.env.IDEMPOTENCY_TTL_SECONDS ?? '86400', 10),
  },
}));
