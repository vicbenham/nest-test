import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../services/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class ExternalService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('orders') private readonly ordersQueue: Queue,
  ) {}

  async createOrder(dto: CreateOrderDto) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: dto.merchantId },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant introuvable');
    }

    await this.ordersQueue.add('process-order', {
      merchantId: dto.merchantId,
      amount: dto.amount,
      description: dto.description,
      merchantEmail: merchant.email,
      merchantName: merchant.name,
    });

    return { message: 'Commande en cours de traitement' };
  }
}