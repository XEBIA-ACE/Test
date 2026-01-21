import swaggerJsdoc from 'swagger-jsdoc';
import { config } from '../config';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Notification Service API',
      version: '1.0.0',
      description: 'Production-ready notification service with Kafka, SendGrid, FCM, WebSockets, and Redis',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.app.port}`,
        description: 'Development server'
      },
      {
        url: 'https://api.production.com',
        description: 'Production server'
      }
    ],
    tags: [
      {
        name: 'Notifications',
        description: 'Notification management endpoints'
      },
      {
        name: 'Health',
        description: 'Health check and monitoring endpoints'
      }
    ],
    components: {
      schemas: {
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['email', 'push', 'websocket', 'sms'] },
            recipient: { type: 'object' },
            payload: { type: 'object' },
            status: { type: 'string', enum: ['pending', 'processing', 'sent', 'failed', 'retrying'] },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
            attempts: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' }
          }
        }
      }
    }
  },
  apis: ['./src/api/routes/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options);
