import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { HealthModule } from './interfaces/http/health/health.module';
import { NotificationModule } from './application/notification.module';
import appConfig from './infrastructure/config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: '.env',
    }),
    TerminusModule,
    HealthModule,
    NotificationModule,
  ],
})
export class AppModule {}
