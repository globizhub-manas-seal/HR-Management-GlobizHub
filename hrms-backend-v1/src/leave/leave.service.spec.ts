import { Test, TestingModule } from '@nestjs/testing';
import { LeaveService } from './leave.service';
import { PrismaService } from '../prisma/prisma.service';

describe('LeaveService', () => {
  let service: LeaveService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaveService,
        {
          provide: PrismaService,
          useValue: {
            holiday: { findMany: jest.fn() },
            leavePolicy: { findMany: jest.fn() },
            leaveAllocation: { findFirst: jest.fn(), create: jest.fn(), findMany: jest.fn() },
            leaveRequest: { aggregate: jest.fn(), findMany: jest.fn(), create: jest.fn() },
            employee: { findUnique: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<LeaveService>(LeaveService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should reject invalid leave dates before querying Prisma', async () => {
    await expect(
      service.createLeaveRequest('emp-1', 'company-1', {
        type: 'ANNUAL' as any,
        startDate: 'not-a-date',
        endDate: '2026-08-14',
        reason: 'Sick leave',
      })
    ).rejects.toThrow('Invalid leave date');
  });
});
