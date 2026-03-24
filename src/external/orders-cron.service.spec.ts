import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { OrdersCronService } from './orders-cron.service';
import { PrismaService } from '../services/prisma.service';

describe('OrdersCronService', () => {
  let service: OrdersCronService;
  let prismaService: jest.Mocked<PrismaService>;
  let loggerSpy: jest.SpyInstance;

  const mockPendingOrder = {
    id: 'order-1',
    merchantId: 'merchant-123',
    amount: 100.5,
    description: 'Test Order',
    status: 'PENDING',
    createdAt: new Date('2026-03-24'),
  };

  const mockProcessedOrder = {
    ...mockPendingOrder,
    status: 'PROCESSED',
  };

  beforeEach(async () => {
    const mockPrismaService = {
      order: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersCronService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<OrdersCronService>(OrdersCronService);
    prismaService = module.get(PrismaService);

    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processPendingOrders', () => {
    it('should find pending orders and update them to PROCESSED status', async () => {
      (prismaService.order.findMany as jest.MockedFunction<any>).mockResolvedValue([
        mockPendingOrder,
      ]);
      (prismaService.order.update as jest.MockedFunction<any>).mockResolvedValue(
        mockProcessedOrder,
      );

      await service.processPendingOrders();

      expect((prismaService.order.findMany as jest.MockedFunction<any>)).toHaveBeenCalledWith({
        where: { status: 'PENDING' },
      });
      expect((prismaService.order.update as jest.MockedFunction<any>)).toHaveBeenCalledWith({
        where: { id: mockPendingOrder.id },
        data: { status: 'PROCESSED' },
      });
    });

    it('should log when checking for pending orders', async () => {
      (prismaService.order.findMany as jest.MockedFunction<any>).mockResolvedValue([]);

      await service.processPendingOrders();

      expect(loggerSpy).toHaveBeenCalledWith(
        'Cron up — checking Orders with status PENDING...',
      );
    });

    it('should log when no pending orders are found', async () => {
      (prismaService.order.findMany as jest.MockedFunction<any>).mockResolvedValue([]);

      await service.processPendingOrders();

      expect(loggerSpy).toHaveBeenCalledWith('No pending Orders');
    });

    it('should return early when no pending orders exist', async () => {
      (prismaService.order.findMany as jest.MockedFunction<any>).mockResolvedValue([]);

      await service.processPendingOrders();

      expect((prismaService.order.update as jest.MockedFunction<any>)).not.toHaveBeenCalled();
    });

    it('should process a single pending order', async () => {
      (prismaService.order.findMany as jest.MockedFunction<any>).mockResolvedValue([
        mockPendingOrder,
      ]);
      (prismaService.order.update as jest.MockedFunction<any>).mockResolvedValue(
        mockProcessedOrder,
      );

      await service.processPendingOrders();

      expect((prismaService.order.update as jest.MockedFunction<any>)).toHaveBeenCalledTimes(1);
      expect((prismaService.order.update as jest.MockedFunction<any>)).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: 'PROCESSED' },
      });
    });

    it('should process multiple pending orders', async () => {
      const order2 = { ...mockPendingOrder, id: 'order-2' };
      const order3 = { ...mockPendingOrder, id: 'order-3' };

      (prismaService.order.findMany as jest.MockedFunction<any>).mockResolvedValue([
        mockPendingOrder,
        order2,
        order3,
      ]);
      (prismaService.order.update as jest.MockedFunction<any>).mockResolvedValue(
        mockProcessedOrder,
      );

      await service.processPendingOrders();

      expect((prismaService.order.update as jest.MockedFunction<any>)).toHaveBeenCalledTimes(3);
      expect((prismaService.order.update as jest.MockedFunction<any>)).toHaveBeenNthCalledWith(
        1,
        {
          where: { id: 'order-1' },
          data: { status: 'PROCESSED' },
        },
      );
      expect((prismaService.order.update as jest.MockedFunction<any>)).toHaveBeenNthCalledWith(
        2,
        {
          where: { id: 'order-2' },
          data: { status: 'PROCESSED' },
        },
      );
      expect((prismaService.order.update as jest.MockedFunction<any>)).toHaveBeenNthCalledWith(
        3,
        {
          where: { id: 'order-3' },
          data: { status: 'PROCESSED' },
        },
      );
    });

    it('should log each processed order with its ID', async () => {
      (prismaService.order.findMany as jest.MockedFunction<any>).mockResolvedValue([
        mockPendingOrder,
      ]);
      (prismaService.order.update as jest.MockedFunction<any>).mockResolvedValue(
        mockProcessedOrder,
      );

      await service.processPendingOrders();

      expect(loggerSpy).toHaveBeenCalledWith(`Order ${mockPendingOrder.id} : PROCESSED`);
    });

    it('should log for each processed order when processing multiple orders', async () => {
      const order2 = { ...mockPendingOrder, id: 'order-2' };
      const order3 = { ...mockPendingOrder, id: 'order-3' };

      (prismaService.order.findMany as jest.MockedFunction<any>).mockResolvedValue([
        mockPendingOrder,
        order2,
        order3,
      ]);
      (prismaService.order.update as jest.MockedFunction<any>).mockResolvedValue(
        mockProcessedOrder,
      );

      await service.processPendingOrders();

      expect(loggerSpy).toHaveBeenCalledWith(`Order order-1 : PROCESSED`);
      expect(loggerSpy).toHaveBeenCalledWith(`Order order-2 : PROCESSED`);
      expect(loggerSpy).toHaveBeenCalledWith(`Order order-3 : PROCESSED`);
    });

    it('should query for orders with PENDING status only', async () => {
      (prismaService.order.findMany as jest.MockedFunction<any>).mockResolvedValue([]);

      await service.processPendingOrders();

      expect((prismaService.order.findMany as jest.MockedFunction<any>)).toHaveBeenCalledWith({
        where: { status: 'PENDING' },
      });
      expect((prismaService.order.findMany as jest.MockedFunction<any>)).toHaveBeenCalledTimes(1);
    });

    it('should update order status to PROCESSED', async () => {
      (prismaService.order.findMany as jest.MockedFunction<any>).mockResolvedValue([
        mockPendingOrder,
      ]);
      (prismaService.order.update as jest.MockedFunction<any>).mockResolvedValue(
        mockProcessedOrder,
      );

      await service.processPendingOrders();

      const updateCall = (
        prismaService.order.update as jest.MockedFunction<any>
      ).mock.calls[0][0];
      expect(updateCall.data.status).toBe('PROCESSED');
    });

    it('should handle prisma findMany errors', async () => {
      const dbError = new Error('Database connection failed');
      (prismaService.order.findMany as jest.MockedFunction<any>).mockRejectedValue(dbError);

      await expect(service.processPendingOrders()).rejects.toThrow('Database connection failed');
      expect((prismaService.order.update as jest.MockedFunction<any>)).not.toHaveBeenCalled();
    });

    it('should handle prisma update errors', async () => {
      (prismaService.order.findMany as jest.MockedFunction<any>).mockResolvedValue([
        mockPendingOrder,
      ]);
      const dbError = new Error('Failed to update order');
      (prismaService.order.update as jest.MockedFunction<any>).mockRejectedValue(dbError);

      await expect(service.processPendingOrders()).rejects.toThrow('Failed to update order');
    });

    it('should stop processing on update error', async () => {
      const order2 = { ...mockPendingOrder, id: 'order-2' };
      (prismaService.order.findMany as jest.MockedFunction<any>).mockResolvedValue([
        mockPendingOrder,
        order2,
      ]);
      const dbError = new Error('Failed to update order');
      (prismaService.order.update as jest.MockedFunction<any>).mockRejectedValueOnce(dbError);

      await expect(service.processPendingOrders()).rejects.toThrow('Failed to update order');
      // Should only have been called once before error
      expect((prismaService.order.update as jest.MockedFunction<any>)).toHaveBeenCalledTimes(1);
    });

    it('should use correct order ID in update query', async () => {
      const customOrderId = 'custom-order-id-123';
      const customOrder = { ...mockPendingOrder, id: customOrderId };

      (prismaService.order.findMany as jest.MockedFunction<any>).mockResolvedValue([
        customOrder,
      ]);
      (prismaService.order.update as jest.MockedFunction<any>).mockResolvedValue(
        mockProcessedOrder,
      );

      await service.processPendingOrders();

      expect((prismaService.order.update as jest.MockedFunction<any>)).toHaveBeenCalledWith({
        where: { id: customOrderId },
        data: { status: 'PROCESSED' },
      });
    });

    it('should preserve order data except status during update', async () => {
      const orderWithData = {
        ...mockPendingOrder,
        merchantId: 'merchant-456',
        amount: 250.75,
        description: 'Custom Order',
      };

      (prismaService.order.findMany as jest.MockedFunction<any>).mockResolvedValue([
        orderWithData,
      ]);
      (prismaService.order.update as jest.MockedFunction<any>).mockResolvedValue({
        ...orderWithData,
        status: 'PROCESSED',
      });

      await service.processPendingOrders();

      expect((prismaService.order.update as jest.MockedFunction<any>)).toHaveBeenCalledWith({
        where: { id: orderWithData.id },
        data: { status: 'PROCESSED' },
      });
    });

    it('should handle empty pending orders array gracefully', async () => {
      (prismaService.order.findMany as jest.MockedFunction<any>).mockResolvedValue([]);

      const result = await service.processPendingOrders();

      expect(result).toBeUndefined();
      expect((prismaService.order.update as jest.MockedFunction<any>)).not.toHaveBeenCalled();
    });

    it('should call findMany only once per execution', async () => {
      const order2 = { ...mockPendingOrder, id: 'order-2' };
      (prismaService.order.findMany as jest.MockedFunction<any>).mockResolvedValue([
        mockPendingOrder,
        order2,
      ]);
      (prismaService.order.update as jest.MockedFunction<any>).mockResolvedValue(
        mockProcessedOrder,
      );

      await service.processPendingOrders();

      expect((prismaService.order.findMany as jest.MockedFunction<any>)).toHaveBeenCalledTimes(1);
    });
  });
});

