import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../services/prisma.service';
import { MailService } from '../services/mails.services';

@Processor('orders')
export class OrdersProcessor extends WorkerHost {
  private readonly logger = new Logger(OrdersProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === 'process-order') {
      this.logger.log(`Traitement du job ${job.id}...`);

      const order = await this.prisma.order.create({
        data: {
          amount: job.data.amount,
          description: job.data.description,
          merchantId: job.data.merchantId,
          status: 'PENDING',
        },
      });

      this.logger.log(`Commande ${order.id} créée`);

      await this.mailService.sendNewOrderNotification(
        job.data.merchantEmail,
        job.data.merchantName,
        order.amount,
        order.description,
      );
    }
  }
}