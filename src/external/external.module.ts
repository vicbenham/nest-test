import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ExternalController } from './external.controller';
import { ExternalService } from './external.service';
import { OrdersCronService } from './orders-cron.service';
import { OrdersProcessor } from './orders.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'orders',
    }),
  ],
  controllers: [ExternalController],
  providers: [ExternalService, OrdersCronService, OrdersProcessor],
})
export class ExternalModule {}
