import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mails.services';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('MailService', () => {
  let service: MailService;
  let mockTransporter: any;
  let loggerSpy: jest.SpyInstance;

  const mockEnv = {
    MAIL_HOST: 'smtp.example.com',
    MAIL_PORT: '587',
    MAIL_USER: 'test@example.com',
    MAIL_PASS: 'password123',
    MAIL_FROM: 'noreply@example.com',
  };

  beforeEach(async () => {
    // Set environment variables BEFORE creating the service
    Object.assign(process.env, mockEnv);

    // Mock transporter BEFORE module creation
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id-123' }),
    };

    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    // Now create the testing module (this will call the constructor and instantiate MailService)
    const module: TestingModule = await Test.createTestingModule({
      providers: [MailService],
    }).compile();

    service = module.get<MailService>(MailService);
    loggerSpy = jest.spyOn(service['logger'], 'log').mockImplementation();

    // Clear mocks AFTER service instantiation so we don't count the initial createTransport call
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendNewOrderNotification', () => {
    const notificationParams = {
      to: 'merchant@example.com',
      merchantName: 'John Doe',
      amount: 150.5,
      description: 'Premium Subscription',
    };

    it('should send an order notification email', async () => {
      await service.sendNewOrderNotification(
        notificationParams.to,
        notificationParams.merchantName,
        notificationParams.amount,
        notificationParams.description,
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: mockEnv.MAIL_FROM,
          to: notificationParams.to,
          subject: 'New order',
        }),
      );
    });

    it('should include merchant name in email text', async () => {
      await service.sendNewOrderNotification(
        notificationParams.to,
        notificationParams.merchantName,
        notificationParams.amount,
        notificationParams.description,
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining(notificationParams.merchantName),
        }),
      );
    });

    it('should include order amount in email text', async () => {
      await service.sendNewOrderNotification(
        notificationParams.to,
        notificationParams.merchantName,
        notificationParams.amount,
        notificationParams.description,
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining(notificationParams.amount.toString()),
        }),
      );
    });

    it('should include order description in email text', async () => {
      await service.sendNewOrderNotification(
        notificationParams.to,
        notificationParams.merchantName,
        notificationParams.amount,
        notificationParams.description,
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining(notificationParams.description),
        }),
      );
    });

    it('should include € currency symbol in email text', async () => {
      await service.sendNewOrderNotification(
        notificationParams.to,
        notificationParams.merchantName,
        notificationParams.amount,
        notificationParams.description,
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('€'),
        }),
      );
    });

    it('should log email sent with correct recipient', async () => {
      await service.sendNewOrderNotification(
        notificationParams.to,
        notificationParams.merchantName,
        notificationParams.amount,
        notificationParams.description,
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining(notificationParams.to),
      );
    });

    it('should log email sent with message ID', async () => {
      await service.sendNewOrderNotification(
        notificationParams.to,
        notificationParams.merchantName,
        notificationParams.amount,
        notificationParams.description,
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('test-message-id-123'),
      );
    });

    it('should send email with correct subject line', async () => {
      await service.sendNewOrderNotification(
        notificationParams.to,
        notificationParams.merchantName,
        notificationParams.amount,
        notificationParams.description,
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'New order',
        }),
      );
    });

    it('should use correct from address', async () => {
      await service.sendNewOrderNotification(
        notificationParams.to,
        notificationParams.merchantName,
        notificationParams.amount,
        notificationParams.description,
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: mockEnv.MAIL_FROM,
        }),
      );
    });

    it('should send to correct recipient address', async () => {
      const customEmail = 'custom@example.com';
      await service.sendNewOrderNotification(
        customEmail,
        notificationParams.merchantName,
        notificationParams.amount,
        notificationParams.description,
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: customEmail,
        }),
      );
    });

    it('should handle different merchant names', async () => {
      const merchantNames = ['Alice Smith', 'Bob Johnson', 'Charlie Brown'];

      for (const name of merchantNames) {
        mockTransporter.sendMail.mockClear();

        await service.sendNewOrderNotification(
          notificationParams.to,
          name,
          notificationParams.amount,
          notificationParams.description,
        );

        expect(mockTransporter.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            text: expect.stringContaining(name),
          }),
        );
      }
    });

    it('should handle different order amounts', async () => {
      const amounts = [10.5, 100.0, 9999.99];

      for (const amount of amounts) {
        mockTransporter.sendMail.mockClear();

        await service.sendNewOrderNotification(
          notificationParams.to,
          notificationParams.merchantName,
          amount,
          notificationParams.description,
        );

        expect(mockTransporter.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            text: expect.stringContaining(amount.toString()),
          }),
        );
      }
    });

    it('should handle different order descriptions', async () => {
      const descriptions = [
        'Basic Plan',
        'Enterprise Package',
        'Special Custom Order',
      ];

      for (const desc of descriptions) {
        mockTransporter.sendMail.mockClear();

        await service.sendNewOrderNotification(
          notificationParams.to,
          notificationParams.merchantName,
          notificationParams.amount,
          desc,
        );

        expect(mockTransporter.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            text: expect.stringContaining(desc),
          }),
        );
      }
    });

    it('should throw error when sendMail fails', async () => {
      const error = new Error('Email service unavailable');
      mockTransporter.sendMail.mockRejectedValueOnce(error);

      await expect(
        service.sendNewOrderNotification(
          notificationParams.to,
          notificationParams.merchantName,
          notificationParams.amount,
          notificationParams.description,
        ),
      ).rejects.toThrow('Email service unavailable');
    });

    it('should call sendMail exactly once per notification', async () => {
      await service.sendNewOrderNotification(
        notificationParams.to,
        notificationParams.merchantName,
        notificationParams.amount,
        notificationParams.description,
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
    });
  });

  describe('sendNewMerchantNotification', () => {
    const merchantParams = {
      name: 'New Merchant Inc',
      email: 'merchant@newcompany.com',
    };

    it('should send a new merchant notification email', async () => {
      await service.sendNewMerchantNotification(merchantParams.name, merchantParams.email);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: mockEnv.MAIL_FROM,
          to: mockEnv.MAIL_FROM,
          subject: 'New Merchant registered',
        }),
      );
    });

    it('should send notification to MAIL_FROM address', async () => {
      await service.sendNewMerchantNotification(merchantParams.name, merchantParams.email);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockEnv.MAIL_FROM,
        }),
      );
    });

    it('should include merchant name in email text', async () => {
      await service.sendNewMerchantNotification(merchantParams.name, merchantParams.email);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining(merchantParams.name),
        }),
      );
    });

    it('should include merchant email in email text', async () => {
      await service.sendNewMerchantNotification(merchantParams.name, merchantParams.email);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining(merchantParams.email),
        }),
      );
    });

    it('should send from correct address', async () => {
      await service.sendNewMerchantNotification(merchantParams.name, merchantParams.email);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: mockEnv.MAIL_FROM,
        }),
      );
    });

    it('should use correct subject line', async () => {
      await service.sendNewMerchantNotification(merchantParams.name, merchantParams.email);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'New Merchant registered',
        }),
      );
    });

    it('should handle different merchant names', async () => {
      const merchantNames = [
        'Tech Solutions Ltd',
        'Digital Marketing Co',
        'E-commerce Pro',
      ];

      for (const name of merchantNames) {
        mockTransporter.sendMail.mockClear();

        await service.sendNewMerchantNotification(name, merchantParams.email);

        expect(mockTransporter.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            text: expect.stringContaining(name),
          }),
        );
      }
    });

    it('should handle different merchant emails', async () => {
      const emails = [
        'contact@company1.com',
        'info@company2.org',
        'admin@company3.net',
      ];

      for (const email of emails) {
        mockTransporter.sendMail.mockClear();

        await service.sendNewMerchantNotification(merchantParams.name, email);

        expect(mockTransporter.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            text: expect.stringContaining(email),
          }),
        );
      }
    });

    it('should throw error when sendMail fails', async () => {
      const error = new Error('SMTP connection failed');
      mockTransporter.sendMail.mockRejectedValueOnce(error);

      await expect(
        service.sendNewMerchantNotification(merchantParams.name, merchantParams.email),
      ).rejects.toThrow('SMTP connection failed');
    });

    it('should call sendMail exactly once per merchant registration', async () => {
      await service.sendNewMerchantNotification(merchantParams.name, merchantParams.email);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
    });

    it('should not require logging of merchant notification', async () => {
      loggerSpy.mockClear();

      await service.sendNewMerchantNotification(merchantParams.name, merchantParams.email);

      // Merchant notification doesn't log, unlike order notification
      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });
  });

});


