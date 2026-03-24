import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MerchantsService } from './merchants.service';
import { PrismaService } from '../services/prisma.service';

describe('MerchantsService', () => {
  let service: MerchantsService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockMerchant = {
    id: 'merchant-123',
    name: 'Test Merchant',
    email: 'merchant@example.com',
    password: 'hashedPassword',
  };

  const mockOrders = [
    {
      id: 'order-1',
      merchantId: 'merchant-123',
      amount: 100.5,
      description: 'First Order',
      createdAt: new Date('2026-01-15'),
    },
    {
      id: 'order-2',
      merchantId: 'merchant-123',
      amount: 250.75,
      description: 'Second Order',
      createdAt: new Date('2026-02-20'),
    },
    {
      id: 'order-3',
      merchantId: 'merchant-123',
      amount: 75.25,
      description: 'Third Order',
      createdAt: new Date('2026-03-10'),
    },
  ];

  beforeEach(async () => {
    const mockPrismaService = {
      merchant: {
        findUnique: jest.fn(),
      },
      order: {
        findMany: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MerchantsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MerchantsService>(MerchantsService);
    prismaService = module.get(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrders', () => {
    const merchantId = 'merchant-123';

    it('should return orders for an existing merchant', async () => {
      (prismaService.merchant.findUnique as jest.MockedFunction<any>).mockResolvedValue(
        mockMerchant,
      );
      (prismaService.order.findMany as jest.MockedFunction<any>).mockResolvedValue(mockOrders);

      const result = await service.getOrders(merchantId);

      expect(result).toEqual(mockOrders);
      expect((prismaService.merchant.findUnique as jest.MockedFunction<any>)).toHaveBeenCalledWith({
        where: { id: merchantId },
      });
      expect((prismaService.order.findMany as jest.MockedFunction<any>)).toHaveBeenCalledWith({
        where: { merchantId },
      });
    });

    it('should throw NotFoundException when merchant does not exist', async () => {
      (prismaService.merchant.findUnique as jest.MockedFunction<any>).mockResolvedValue(null);

      await expect(service.getOrders(merchantId)).rejects.toThrow(NotFoundException);
      await expect(service.getOrders(merchantId)).rejects.toThrow('Cannot find Merchant');

      expect((prismaService.merchant.findUnique as jest.MockedFunction<any>)).toHaveBeenCalledWith({
        where: { id: merchantId },
      });
      expect((prismaService.order.findMany as jest.MockedFunction<any>)).not.toHaveBeenCalled();
    });

    it('should return empty array when merchant exists but has no orders', async () => {
      (prismaService.merchant.findUnique as jest.MockedFunction<any>).mockResolvedValue(
        mockMerchant,
      );
      (prismaService.order.findMany as jest.MockedFunction<any>).mockResolvedValue([]);

      const result = await service.getOrders(merchantId);

      expect(result).toEqual([]);
      expect((prismaService.order.findMany as jest.MockedFunction<any>)).toHaveBeenCalledWith({
        where: { merchantId },
      });
    });

    it('should call findUnique with correct merchant ID', async () => {
      const customMerchantId = 'custom-merchant-id-456';
      (prismaService.merchant.findUnique as jest.MockedFunction<any>).mockResolvedValue(
        mockMerchant,
      );
      (prismaService.order.findMany as jest.MockedFunction<any>).mockResolvedValue(mockOrders);

      await service.getOrders(customMerchantId);

      expect((prismaService.merchant.findUnique as jest.MockedFunction<any>)).toHaveBeenCalledWith({
        where: { id: customMerchantId },
      });
    });

    it('should filter orders by correct merchantId', async () => {
      const customMerchantId = 'merchant-789';
      (prismaService.merchant.findUnique as jest.MockedFunction<any>).mockResolvedValue({
        ...mockMerchant,
        id: customMerchantId,
      });
      (prismaService.order.findMany as jest.MockedFunction<any>).mockResolvedValue(mockOrders);

      await service.getOrders(customMerchantId);

      expect((prismaService.order.findMany as jest.MockedFunction<any>)).toHaveBeenCalledWith({
        where: { merchantId: customMerchantId },
      });
    });

    it('should not call findMany when merchant lookup fails', async () => {
      (prismaService.merchant.findUnique as jest.MockedFunction<any>).mockResolvedValue(null);

      try {
        await service.getOrders(merchantId);
      } catch (e) {
        // Expected to throw
      }

      expect((prismaService.order.findMany as jest.MockedFunction<any>)).not.toHaveBeenCalled();
    });

    it('should call findUnique before findMany', async () => {
      const callOrder: string[] = [];
      
      (prismaService.merchant.findUnique as jest.MockedFunction<any>).mockImplementation(() => {
        callOrder.push('findUnique');
        return Promise.resolve(mockMerchant);
      });
      (prismaService.order.findMany as jest.MockedFunction<any>).mockImplementation(() => {
        callOrder.push('findMany');
        return Promise.resolve(mockOrders);
      });

      await service.getOrders(merchantId);

      expect(callOrder).toEqual(['findUnique', 'findMany']);
    });

    it('should return multiple orders correctly', async () => {
      const multipleOrders = [...mockOrders, ...mockOrders];
      (prismaService.merchant.findUnique as jest.MockedFunction<any>).mockResolvedValue(
        mockMerchant,
      );
      (prismaService.order.findMany as jest.MockedFunction<any>).mockResolvedValue(multipleOrders);

      const result = await service.getOrders(merchantId);

      expect(result).toHaveLength(6);
      expect(result).toEqual(multipleOrders);
    });

    it('should handle merchant with special characters in ID', async () => {
      const specialMerchantId = 'merchant-with-special-chars-!@#$';
      (prismaService.merchant.findUnique as jest.MockedFunction<any>).mockResolvedValue(
        mockMerchant,
      );
      (prismaService.order.findMany as jest.MockedFunction<any>).mockResolvedValue(mockOrders);

      await service.getOrders(specialMerchantId);

      expect((prismaService.merchant.findUnique as jest.MockedFunction<any>)).toHaveBeenCalledWith({
        where: { id: specialMerchantId },
      });
    });

    it('should properly propagate errors from Prisma', async () => {
      const dbError = new Error('Database connection failed');
      (prismaService.merchant.findUnique as jest.MockedFunction<any>).mockRejectedValue(dbError);

      await expect(service.getOrders(merchantId)).rejects.toThrow('Database connection failed');
    });

    it('should properly propagate errors from findMany', async () => {
      (prismaService.merchant.findUnique as jest.MockedFunction<any>).mockResolvedValue(
        mockMerchant,
      );
      const dbError = new Error('Order retrieval failed');
      (prismaService.order.findMany as jest.MockedFunction<any>).mockRejectedValue(dbError);

      await expect(service.getOrders(merchantId)).rejects.toThrow('Order retrieval failed');
    });
  });
});


