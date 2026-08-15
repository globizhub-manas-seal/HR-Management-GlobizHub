import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PayrollService', () => {
  let service: PayrollService;
  const prisma = {
    employee: {
      findFirst: jest.fn(),
    },
    payrollRecord: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    leaveRequest: {
      count: jest.fn(),
    },
    attendance: {
      aggregate: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayrollService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<PayrollService>(PayrollService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generatePayroll', () => {
    beforeEach(() => {
      prisma.employee.findFirst.mockResolvedValue({
        id: 'employee-1',
        companyId: 'company-1',
        salaryStructure: {
          basicSalary: 30000,
          hra: 5000,
          otherAllowances: 2000,
          pfContribution: 1800,
          taxDeduction: 2500,
        },
      });
      prisma.payrollRecord.findUnique.mockResolvedValue(null);
      prisma.leaveRequest.count.mockResolvedValue(1);
      prisma.attendance.aggregate.mockResolvedValue({
        _count: { id: 20 },
        _sum: { overtimeHours: 5 },
      });
      prisma.payrollRecord.upsert.mockResolvedValue({
        id: 'payroll-1',
        employeeId: 'employee-1',
        month: 5,
        year: 2026,
        netSalary: 31450,
      });
    });

    it('creates a payroll draft for a valid employee', async () => {
      await expect(
        service.generatePayroll('company-1', 'employee-1', 5, 2026, 'processor-1'),
      ).resolves.toEqual(
        expect.objectContaining({
          id: 'payroll-1',
          employeeId: 'employee-1',
          month: 5,
          year: 2026,
        }),
      );

      expect(prisma.payrollRecord.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            employeeId_month_year: { employeeId: 'employee-1', month: 5, year: 2026 },
          },
          create: expect.objectContaining({
            employeeId: 'employee-1',
            month: 5,
            year: 2026,
            status: 'DRAFT',
          }),
        }),
      );
    });

    it('throws NotFoundException when employee does not exist', async () => {
      prisma.employee.findFirst.mockResolvedValue(null);

      await expect(
        service.generatePayroll('company-1', 'employee-1', 5, 2026, 'processor-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when salary structure is missing', async () => {
      prisma.employee.findFirst.mockResolvedValue({
        id: 'employee-1',
        companyId: 'company-1',
        salaryStructure: null,
      });

      await expect(
        service.generatePayroll('company-1', 'employee-1', 5, 2026, 'processor-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
