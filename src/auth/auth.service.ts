import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto) {
    console.log('--- Register called with ---', dto);

    const existing = await this.prisma.merchant.findUnique({
      where: { email: dto.email },
    });
    console.log('--- Existing ---', existing);

    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    console.log('--- Password hashed ---');

    const merchant = await this.prisma.merchant.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
      },
    });
    console.log('--- Merchant created ---', merchant);

    return {
      message: 'Merchant registered successfully',
      merchant: {
        id: merchant.id,
        email: merchant.email,
        name: merchant.name,
      },
    };
  }
}
