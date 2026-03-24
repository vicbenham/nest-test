import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../services/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RegisterDto } from './dto/register.dto';
import { MerchantRegisteredEvent } from './events/merchants-registered.event';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: jest.Mocked<PrismaService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(async () => {
    const mockPrismaService = {
      merchant: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(null),
      },
    } as unknown as jest.Mocked<PrismaService>;

    const mockEventEmitter = {
      emit: jest.fn(),
    } as unknown as jest.Mocked<EventEmitter2>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    eventEmitter = module.get(EventEmitter2);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      name: 'Test Merchant',
      email: 'test@example.com',
      password: 'password123',
    };

    it('should register a new merchant successfully', async () => {
      const hashedPassword = 'hashedPassword';
      const createdMerchant = {
        id: 'merchantId',
        name: registerDto.name,
        email: registerDto.email,
        password: hashedPassword,
      };

      (prismaService.merchant.findUnique as jest.MockedFunction<any>).mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);
      (prismaService.merchant.create as jest.MockedFunction<any>).mockResolvedValue(createdMerchant);

      const result = await service.register(registerDto);

      expect(prismaService.merchant.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(prismaService.merchant.create).toHaveBeenCalledWith({
        data: {
          name: registerDto.name,
          email: registerDto.email,
          password: hashedPassword,
        },
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'merchant.registered',
        new MerchantRegisteredEvent(createdMerchant.id, createdMerchant.email, createdMerchant.name),
      );
      expect(result).toEqual({
        message: 'Merchant registered successfully',
        merchant: {
          id: createdMerchant.id,
          email: createdMerchant.email,
          name: createdMerchant.name,
        },
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      const existingMerchant = {
        id: 'existingId',
        name: 'Existing Merchant',
        email: registerDto.email,
        password: 'existingPassword',
      };

      (prismaService.merchant.findUnique as jest.MockedFunction<any>).mockResolvedValue(existingMerchant);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect((prismaService.merchant.findUnique as jest.MockedFunction<any>)).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(prismaService.merchant.create).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });
});
