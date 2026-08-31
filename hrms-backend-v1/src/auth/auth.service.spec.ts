import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  const prisma = {
    employee: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    company: {
      create: jest.fn(),
    },
  };
  const jwt = {
    signAsync: jest.fn(),
  };
  const emailService = {
    sendPasswordResetEmail: jest.fn(),
  };
  const auditService = {
    logAction: jest.fn(),
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
        {
          provide: EmailService,
          useValue: emailService,
        },
        {
          provide: AuditService,
          useValue: auditService,
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

    await expect(service.login('  Alex@Acme.COM  ', password)).resolves.toEqual(
      { access_token: 'token' },
    );

    expect(prisma.employee.findUnique).toHaveBeenCalledWith({
      where: { email: 'alex@acme.com' },
    });
  });

  describe('forgotPassword', () => {
    it('normalizes the email, sets tokens in DB, and sends reset email', async () => {
      const email = '  Alex@Acme.COM  ';
      const normalizedEmail = 'alex@acme.com';

      prisma.employee.findUnique.mockResolvedValue({
        id: 'employee-1',
        email: normalizedEmail,
      });

      prisma.employee.update.mockResolvedValue({});
      emailService.sendPasswordResetEmail.mockResolvedValue(undefined);

      await expect(service.forgotPassword(email)).resolves.toEqual({
        message: 'If that email exists, a reset link has been sent.',
      });

      expect(prisma.employee.findUnique).toHaveBeenCalledWith({
        where: { email: normalizedEmail },
      });

      expect(prisma.employee.update).toHaveBeenCalledWith({
        where: { id: 'employee-1' },
        data: {
          resetPasswordToken: expect.any(String),
          resetPasswordExpires: expect.any(Date),
        },
      });

      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        normalizedEmail,
        expect.stringContaining('/reset-password?token='),
      );
    });
  });
});
