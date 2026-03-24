import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { ExternalService } from './external.service';
import { PrismaService } from '../services/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

describe('ExternalService', () => {
  let service: ExternalService;
  let prismaService: jest.Mocked<PrismaService>;
  let ordersQueue: any;

  const mockMerchant = {
    id: 'merchant-123',
    name: 'Test Merchant',
    email: 'merchant@example.com',
    password: 'hashedPassword',
  };

  beforeEach(async () => {
    const mockPrismaService = {
      merchant: {
        findUnique: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    const mockOrdersQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-123' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExternalService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: getQueueToken('orders'),
          useValue: mockOrdersQueue,
        },
      ],
    }).compile();

    service = module.get<ExternalService>(ExternalService);
    prismaService = module.get(PrismaService);
    ordersQueue = module.get(getQueueToken('orders'));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrder', () => {
    const createOrderDto: CreateOrderDto = {
      merchantId: 'merchant-123',
      amount: 100.5,
      description: 'Test Order',
    };

    it('should successfully create an order for an existing merchant', async () => {
      (prismaService.merchant.findUnique as jest.MockedFunction<any>).mockResolvedValue(
        mockMerchant,
      );

      const result = await service.createOrder(createOrderDto);

      expect(result).toEqual({ message: 'Processing order' });
      expect((prismaService.merchant.findUnique as jest.MockedFunction<any>)).toHaveBeenCalledWith({
        where: { id: createOrderDto.merchantId },
      });
      expect(ordersQueue.add).toHaveBeenCalledWith('process-order', {
        merchantId: createOrderDto.merchantId,
        amount: createOrderDto.amount,
        description: createOrderDto.description,
        merchantEmail: mockMerchant.email,
        merchantName: mockMerchant.name,
      });
    });

    it('should throw NotFoundException when merchant does not exist', async () => {
      (prismaService.merchant.findUnique as jest.MockedFunction<any>).mockResolvedValue(null);

      await expect(service.createOrder(createOrderDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createOrder(createOrderDto)).rejects.toThrow(
        'Cannot find Merchant',
      );

      expect((prismaService.merchant.findUnique as jest.MockedFunction<any>)).toHaveBeenCalledWith({
        where: { id: createOrderDto.merchantId },
      });
      expect(ordersQueue.add).not.toHaveBeenCalled();
    });

    it('should pass correct order data to the queue', async () => {
      (prismaService.merchant.findUnique as jest.MockedFunction<any>).mockResolvedValue(
        mockMerchant,
      );

      const customDto: CreateOrderDto = {
        merchantId: 'merchant-456',
        amount: 250.75,
        description: 'Custom Order Description',
      };

      await service.createOrder(customDto);

      expect(ordersQueue.add).toHaveBeenCalledWith('process-order', {
        merchantId: 'merchant-456',
        amount: 250.75,
        description: 'Custom Order Description',
        merchantEmail: mockMerchant.email,
        merchantName: mockMerchant.name,
      });
    });

    it('should handle merchant with different name and email', async () => {
      const customMerchant = {
        id: 'merchant-789',
        name: 'Another Merchant Inc',
        email: 'contact@another.com',
        password: 'hashedPassword2',
      };

      (prismaService.merchant.findUnique as jest.MockedFunction<any>).mockResolvedValue(
        customMerchant,
      );

      const result = await service.createOrder(createOrderDto);

      expect(result).toEqual({ message: 'Processing order' });
      expect(ordersQueue.add).toHaveBeenCalledWith(
        'process-order',
        expect.objectContaining({
          merchantEmail: 'contact@another.com',
          merchantName: 'Another Merchant Inc',
        }),
      );
    });

    it('should call prisma with correct merchant ID', async () => {
      (prismaService.merchant.findUnique as jest.MockedFunction<any>).mockResolvedValue(
        mockMerchant,
      );

      const customMerchantId = 'custom-merchant-id-123';
      await service.createOrder({
        ...createOrderDto,
        merchantId: customMerchantId,
      });

      expect((prismaService.merchant.findUnique as jest.MockedFunction<any>)).toHaveBeenCalledWith({
        where: { id: customMerchantId },
      });
    });

    it('should only call ordersQueue.add once per createOrder call', async () => {
      (prismaService.merchant.findUnique as jest.MockedFunction<any>).mockResolvedValue(
        mockMerchant,
      );

      await service.createOrder(createOrderDto);

      expect(ordersQueue.add).toHaveBeenCalledTimes(1);
    });

    it('should not call ordersQueue.add when merchant not found', async () => {
      (prismaService.merchant.findUnique as jest.MockedFunction<any>).mockResolvedValue(null);

      try {
        await service.createOrder(createOrderDto);
      } catch (e) {
        // Expected to throw
      }

      expect(ordersQueue.add).not.toHaveBeenCalled();
    });
  });
});

