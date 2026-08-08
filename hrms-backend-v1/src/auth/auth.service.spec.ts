import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  const prisma = {
    employee: {
      findUnique: jest.fn(),
    },
    company: {
      create: jest.fn(),
    },
  };
  const jwt = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: JwtService,
          useValue: jwt,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('logs in with an email that differs only by casing or surrounding whitespace', async () => {
    const password = 'correct-horse-battery-staple';
    prisma.employee.findUnique.mockResolvedValue({
      id: 'employee-1',
      email: 'alex@acme.com',
      password: await bcrypt.hash(password, 10),
      companyId: 'company-1',
    });
    jwt.signAsync.mockResolvedValue('token');

    await expect(
      service.login({ email: '  Alex@Acme.COM  ', password }),
    ).resolves.toEqual({ access_token: 'token' });

    expect(prisma.employee.findUnique).toHaveBeenCalledWith({
      where: { email: 'alex@acme.com' },
    });
  });
});
