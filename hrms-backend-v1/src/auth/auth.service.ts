import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

export class RegisterDto {
  email?: string;
  password?: string;
  companyName?: string;
  firstName?: string;
  lastName?: string;
}

export class LoginDto {
  email?: string;
  password?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // 1. REGISTER NEW COMPANY & ADMIN
  async register(data: RegisterDto) {
    if (
      !data.email ||
      !data.password ||
      !data.companyName ||
      !data.firstName ||
      !data.lastName
    ) {
      throw new BadRequestException('Missing required registration fields');
    }

    // Check if the email is already in use
    const existingUser = await this.prisma.employee.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash the password securely
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Prisma Nested Write: Create Company AND Employee in one step
    const company = await this.prisma.company.create({
      data: {
        name: data.companyName,
        employees: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            password: hashedPassword,
          },
        },
      },
      include: {
        employees: true, // Return the newly created employee data
      },
    });

    const newAdmin = company.employees[0];

    // Generate JWT Token
    const payload = {
      sub: newAdmin.id,
      email: newAdmin.email,
      companyId: company.id,
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
      message: 'Registration successful!',
    };
  }

  // 2. LOGIN EXISTING USER
  async login(data: LoginDto) {
    if (!data.email || !data.password) {
      throw new BadRequestException('Missing email or password');
    }

    const user = await this.prisma.employee.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Compare provided password with hashed password in DB
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      companyId: user.companyId,
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
