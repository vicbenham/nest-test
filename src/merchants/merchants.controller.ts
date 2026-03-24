import { Controller, Get, Param } from '@nestjs/common';
import { MerchantsService } from './merchants.service';

@Controller('merchants')
export class MerchantsController {
  constructor(private readonly merchantsService: MerchantsService) {}

  @Get(':merchantId/orders')
  getOrders(@Param('merchantId') merchantId: string) {
    return this.merchantsService.getOrders(merchantId);
  }
}