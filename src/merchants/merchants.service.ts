import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';

@Injectable()
export class MerchantsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrders(merchantId: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant introuvable');
    }

    return this.prisma.order.findMany({
      where: { merchantId },
    });
  }
}
