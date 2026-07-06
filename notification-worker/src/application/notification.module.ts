import { Module } from '@nestjs/common';
import { ProcessProjectEventUseCase } from './use-cases/process-project-event.use-case';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';

@Module({
  imports: [InfrastructureModule],
  providers: [ProcessProjectEventUseCase],
  exports: [ProcessProjectEventUseCase],
})
export class NotificationModule {}
