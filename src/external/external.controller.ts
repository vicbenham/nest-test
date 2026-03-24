import { Controller, Post, Body } from '@nestjs/common';
import { ExternalService } from './external.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('external')
export class ExternalController {
  constructor(private readonly externalService: ExternalService) {}

  @Post('orders')
  createOrder(@Body() dto: CreateOrderDto) {
    return this.externalService.createOrder(dto);
  }
}