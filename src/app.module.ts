import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './services/prisma.service';
import { AuthModule } from './auth/auth.module';
import { ExternalModule } from './external/external.module';
import { MerchantsModule } from './merchants/merchants.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MerchantListener } from './auth/listeners/merchants.listener';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    AuthModule,
    ExternalModule,
    MerchantsModule,
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, MerchantListener],
  exports: [PrismaService],
})
export class AppModule {}
