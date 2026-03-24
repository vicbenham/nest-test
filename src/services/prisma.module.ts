import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { MailService } from './mails.services';

@Global()
@Module({
  providers: [PrismaService, MailService],
  exports: [PrismaService, MailService],
})
export class PrismaModule {}
