import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../services/prisma.service';

@Injectable()
export class OrdersCronService {
  private readonly logger = new Logger(OrdersCronService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron('2 * * * * *') // toutes les 2 minutes pour tester
  async processPendingOrders() {
    this.logger.log('Cron lancé — vérification des commandes PENDING...');

    const pendingOrders = await this.prisma.order.findMany({
      where: { status: 'PENDING' },
    });

    if (pendingOrders.length === 0) {
      this.logger.log('Aucune commande en attente');
      return;
    }

    for (const order of pendingOrders) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'PROCESSED' },
      });

      this.logger.log(`Commande ${order.id} → PROCESSED`);
    }
  }
}