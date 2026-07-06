// Root Application Module

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs-modules/ioredis';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ProjectsModule } from './modules/projects.module';
import { ProjectOrmEntity } from './infrastructure/persistence/typeorm/project.orm-entity';
import { HealthController } from './interfaces/http/controllers/health.controller';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({ isGlobal: true }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [ProjectOrmEntity],
        synchronize: false, // Use migrations in production
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),

    // Redis
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        config: {
          url: config.get<string>('REDIS_URL', 'redis://localhost:6379'),
        },
      }),
    }),

    // RabbitMQ
    RabbitMQModule.forRootAsync(RabbitMQModule, {
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        exchanges: [
          {
            name: 'project.events',
            type: 'topic',
          },
        ],
        uri: config.get<string>('RABBITMQ_URL', 'amqp://localhost:5672'),
        connectionInitOptions: { wait: false },
      }),
    }),

    // Feature Modules
    ProjectsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
