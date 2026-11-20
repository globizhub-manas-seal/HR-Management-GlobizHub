import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeService } from './employee.service';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { AuditService } from '../audit/audit.service';
import { NotFoundException } from '@nestjs/common';

describe('EmployeeService', () => {
  let service: EmployeeService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      employee: {
        findFirst: jest.fn(),
      },
      employmentHistory: {
        findFirst: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeService,
        { provide: PrismaService, useValue: prisma },
        { provide: S3Service, useValue: {} },
        { provide: AuditService, useValue: { logAction: jest.fn() } },
      ],
    }).compile();

    service = module.get<EmployeeService>(EmployeeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findEmployeeById', () => {
    it('queries employee with employmentHistory, exitRecord, credentials, skills, emergencyContacts', async () => {
      const mockEmployee = {
        id: 'emp-1',
        companyId: 'comp-1',
        firstName: 'Sarah',
        lastName: 'Connor',
        email: 'sarah@resistance.org',
        skills: [{ id: 'sk-1', name: 'Tactics' }],
        emergencyContacts: [{ id: 'ec-1', name: 'John Connor', phone: '123' }],
        employmentHistory: [
          {
            id: 'eh-1',
            companyName: 'Cyberdyne Systems',
            jobTitle: 'Consultant',
            startDate: new Date('2020-01-01'),
            endDate: new Date('2022-01-01'),
          },
        ],
        exitRecord: {
          id: 'ex-1',
          exitDate: new Date('2022-02-01'),
          reason: 'RESIGNED',
          exitInterviewNotes: 'Departed for secret mission',
        },
        credentials: [
          {
            id: 'cr-1',
            title: 'Advanced Medical License',
            credentialType: 'MEDICAL_COUNCIL_REGISTRATION',
            registrationNumber: 'MED-9921',
          },
        ],
        designation: { id: 'des-1', name: 'Senior Specialist' },
        department: { id: 'dep-1', name: 'Operations' },
        reportingManager: null,
        statutoryProfiles: [
          {
            epfoUan: '100200300400',
            esicIpNumber: '9988776655',
            establishmentId: 'est-1',
          },
        ],
      };

      prisma.employee.findFirst.mockResolvedValue(mockEmployee);

      const res = await service.findEmployeeById('comp-1', 'emp-1');

      expect(prisma.employee.findFirst).toHaveBeenCalledWith({
        where: { id: 'emp-1', companyId: 'comp-1' },
        include: {
          skills: true,
          emergencyContacts: true,
          employmentHistory: { orderBy: { startDate: 'desc' } },
          exitRecord: true,
          credentials: true,
          designation: true,
          department: true,
          reportingManager: true,
          statutoryProfiles: {
            include: {
              establishment: true,
            },
          },
        },
      });

      expect(res.employmentHistory).toHaveLength(1);
      expect(res.employmentHistory[0].companyName).toBe('Cyberdyne Systems');
      expect(res.exitRecord.reason).toBe('RESIGNED');
      expect(res.credentials).toHaveLength(1);
      expect(res.credentials[0].registrationNumber).toBe('MED-9921');
      expect(res.uanNumber).toBe('100200300400');
      expect(res.esicIpNumber).toBe('9988776655');
      expect(res.establishmentId).toBe('est-1');
    });

    it('throws NotFoundException when employee is not found in company workspace', async () => {
      prisma.employee.findFirst.mockResolvedValue(null);

      await expect(
        service.findEmployeeById('comp-1', 'nonexistent-emp'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeEmploymentHistory', () => {
    it('removes employment history record when found', async () => {
      prisma.employmentHistory.findFirst.mockResolvedValue({
        id: 'eh-1',
        employeeId: 'emp-1',
      });
      prisma.employmentHistory.delete.mockResolvedValue({ id: 'eh-1' });

      const res = await service.removeEmploymentHistory('emp-1', 'eh-1');

      expect(prisma.employmentHistory.delete).toHaveBeenCalledWith({
        where: { id: 'eh-1' },
      });
      expect(res.id).toBe('eh-1');
    });

    it('throws NotFoundException when history record does not belong to employee', async () => {
      prisma.employmentHistory.findFirst.mockResolvedValue(null);

      await expect(
        service.removeEmploymentHistory('emp-1', 'unknown-eh'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
