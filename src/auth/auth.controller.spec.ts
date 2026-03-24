import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockRegisterDto: RegisterDto = {
    name: 'Test Merchant',
    email: 'test@example.com',
    password: 'password123',
  };

  const mockRegisteredMerchant = {
    message: 'Merchant registered successfully',
    merchant: {
      id: 'merchant-123',
      name: mockRegisterDto.name,
      email: mockRegisterDto.email,
    },
  };

  beforeEach(async () => {
    const mockAuthService = {
      register: jest.fn().mockResolvedValue(mockRegisteredMerchant),
    } as unknown as jest.Mocked<AuthService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register with correct dto', async () => {
      await controller.register(mockRegisterDto);

      expect(authService.register).toHaveBeenCalledWith(mockRegisterDto);
    });

    it('should return registered merchant data', async () => {
      const result = await controller.register(mockRegisterDto);

      expect(result).toEqual(mockRegisteredMerchant);
    });

    it('should call authService.register exactly once', async () => {
      await controller.register(mockRegisterDto);

      expect(authService.register).toHaveBeenCalledTimes(1);
    });

    it('should handle different merchant names', async () => {
      const customDto: RegisterDto = {
        ...mockRegisterDto,
        name: 'Another Merchant',
      };

      await controller.register(customDto);

      expect(authService.register).toHaveBeenCalledWith(customDto);
    });

    it('should handle different email addresses', async () => {
      const customDto: RegisterDto = {
        ...mockRegisterDto,
        email: 'another@example.com',
      };

      await controller.register(customDto);

      expect(authService.register).toHaveBeenCalledWith(customDto);
    });

    it('should handle different passwords', async () => {
      const customDto: RegisterDto = {
        ...mockRegisterDto,
        password: 'differentPassword123',
      };

      await controller.register(customDto);

      expect(authService.register).toHaveBeenCalledWith(customDto);
    });

    it('should return merchant with id', async () => {
      const result = await controller.register(mockRegisterDto);

      expect(result.merchant).toHaveProperty('id');
      expect(result.merchant.id).toBe('merchant-123');
    });

    it('should return merchant with email', async () => {
      const result = await controller.register(mockRegisterDto);

      expect(result.merchant).toHaveProperty('email');
      expect(result.merchant.email).toBe(mockRegisterDto.email);
    });

    it('should return merchant with name', async () => {
      const result = await controller.register(mockRegisterDto);

      expect(result.merchant).toHaveProperty('name');
      expect(result.merchant.name).toBe(mockRegisterDto.name);
    });

    it('should return success message', async () => {
      const result = await controller.register(mockRegisterDto);

      expect(result).toHaveProperty('message');
      expect(result.message).toBe('Merchant registered successfully');
    });

    it('should propagate authService errors', async () => {
      const error = new Error('Registration failed');
      (authService.register as jest.MockedFunction<any>).mockRejectedValueOnce(error);

      await expect(controller.register(mockRegisterDto)).rejects.toThrow('Registration failed');
    });

    it('should propagate conflict exception from authService', async () => {
      const error = new Error('Email already exists');
      (authService.register as jest.MockedFunction<any>).mockRejectedValueOnce(error);

      await expect(controller.register(mockRegisterDto)).rejects.toThrow('Email already exists');
    });

    it('should handle registrations with special characters in name', async () => {
      const specialDto: RegisterDto = {
        ...mockRegisterDto,
        name: "O'Brien & Co.",
      };

      await controller.register(specialDto);

      expect(authService.register).toHaveBeenCalledWith(specialDto);
    });

    it('should handle registrations with special characters in email', async () => {
      const specialDto: RegisterDto = {
        ...mockRegisterDto,
        email: 'test+merchant@example.com',
      };

      await controller.register(specialDto);

      expect(authService.register).toHaveBeenCalledWith(specialDto);
    });

    it('should return all merchant properties', async () => {
      const result = await controller.register(mockRegisterDto);

      expect(result).toEqual(expect.objectContaining({
        message: expect.any(String),
        merchant: expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          email: expect.any(String),
        }),
      }));
    });

    it('should handle multiple sequential registrations', async () => {
      const dto1: RegisterDto = {
        ...mockRegisterDto,
        email: 'merchant1@example.com',
      };
      const dto2: RegisterDto = {
        ...mockRegisterDto,
        email: 'merchant2@example.com',
      };

      await controller.register(dto1);
      await controller.register(dto2);

      expect(authService.register).toHaveBeenCalledTimes(2);
      expect(authService.register).toHaveBeenNthCalledWith(1, dto1);
      expect(authService.register).toHaveBeenNthCalledWith(2, dto2);
    });

    it('should preserve dto properties when calling service', async () => {
      const customDto: RegisterDto = {
        name: 'Custom Merchant Name',
        email: 'custom@domain.com',
        password: 'customPassword456',
      };

      await controller.register(customDto);

      const callArg = (authService.register as jest.MockedFunction<any>).mock.calls[0][0];
      expect(callArg.name).toBe('Custom Merchant Name');
      expect(callArg.email).toBe('custom@domain.com');
      expect(callArg.password).toBe('customPassword456');
    });
  });
});
