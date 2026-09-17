import { Test, TestingModule } from '@nestjs/testing';
import { JobRequisitionService } from './job-requisition.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SequenceService } from './sequence.service';
import { AuditService } from '../../audit/audit.service';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DirectJobReasonEnum } from '../dto/create-job-requisition.dto';

describe('JobRequisitionService', () => {
  let service: JobRequisitionService;
  let prisma: any;
  let sequenceService: any;
  let auditService: any;

  const mockCompanyId = 'comp-123';
  const mockUserAdmin = {
    sub: 'emp-admin-1',
    companyId: mockCompanyId,
    role: 'HR_HEAD',
  };
  const mockUserManager = {
    sub: 'emp-mgr-1',
    companyId: mockCompanyId,
    role: 'MANAGER',
  };

  beforeEach(async () => {
    prisma = {
      jobRequisition: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      manpowerRequisition: {
        findFirst: jest.fn(),
      },
      department: {
        findFirst: jest.fn(),
      },
    };

    sequenceService = {
      getNextSequence: jest.fn().mockResolvedValue('JOB-2026-0001'),
    };

    auditService = {
      logAction: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobRequisitionService,
        { provide: PrismaService, useValue: prisma },
        { provide: SequenceService, useValue: sequenceService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<JobRequisitionService>(JobRequisitionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createFromManpowerRequisition', () => {
    it('should throw NotFoundException if manpower requisition does not exist', async () => {
      prisma.manpowerRequisition.findFirst.mockResolvedValue(null);

      await expect(
        service.createFromManpowerRequisition(mockCompanyId, mockUserAdmin, {
          manpowerRequisitionId: 'm-non-existent',
          title: 'Backend Dev',
          departmentId: 'dept-1',
          location: 'Guwahati',
          openings: 2,
          description: 'Desc',
          responsibilities: 'Resp',
          requirements: 'Reqs',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if manpower requisition is not APPROVED', async () => {
      prisma.manpowerRequisition.findFirst.mockResolvedValue({
        id: 'm-1',
        status: 'SUBMITTED',
        department: { name: 'Eng' },
        designation: { name: 'Dev' },
      });

      await expect(
        service.createFromManpowerRequisition(mockCompanyId, mockUserAdmin, {
          manpowerRequisitionId: 'm-1',
          title: 'Backend Dev',
          departmentId: 'dept-1',
          location: 'Guwahati',
          openings: 2,
          description: 'Desc',
          responsibilities: 'Resp',
          requirements: 'Reqs',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if an active job already exists for this manpower requisition', async () => {
      prisma.manpowerRequisition.findFirst.mockResolvedValue({
        id: 'm-1',
        status: 'APPROVED',
        department: { name: 'Eng' },
        designation: { name: 'Dev' },
      });

      // Existing active job found
      prisma.jobRequisition.findFirst.mockResolvedValue({
        id: 'job-existing',
        jobCode: 'JOB-2026-0001',
        status: 'PUBLISHED',
      });

      await expect(
        service.createFromManpowerRequisition(mockCompanyId, mockUserAdmin, {
          manpowerRequisitionId: 'm-1',
          title: 'Backend Dev',
          departmentId: 'dept-1',
          location: 'Guwahati',
          openings: 2,
          description: 'Desc',
          responsibilities: 'Resp',
          requirements: 'Reqs',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully create a snapshot job requisition when approved and no duplicates', async () => {
      prisma.manpowerRequisition.findFirst.mockResolvedValue({
        id: 'm-1',
        status: 'APPROVED',
        departmentId: 'dept-1',
        designationId: 'desig-1',
        location: 'Guwahati',
        employmentType: 'FULL_TIME',
        positionsCount: 2,
        requiredSkills: ['Node.js', 'NestJS'],
        minSalary: 600000,
        maxSalary: 800000,
        department: { id: 'dept-1', name: 'Engineering' },
        designation: { id: 'desig-1', name: 'Backend Developer' },
      });

      // No active job exists
      prisma.jobRequisition.findFirst.mockResolvedValue(null);

      const mockCreatedJob = {
        id: 'job-new',
        jobCode: 'JOB-2026-0001',
        status: 'DRAFT',
        openings: 2,
      };
      prisma.jobRequisition.create.mockResolvedValue(mockCreatedJob);

      const result = await service.createFromManpowerRequisition(
        mockCompanyId,
        mockUserAdmin,
        {
          manpowerRequisitionId: 'm-1',
          title: 'Backend Developer',
          departmentId: 'dept-1',
          location: 'Guwahati',
          openings: 2,
          description: 'Role overview',
          responsibilities: 'Coding',
          requirements: 'Experience',
        },
      );

      expect(result).toEqual(mockCreatedJob);
      expect(sequenceService.getNextSequence).toHaveBeenCalledWith(
        mockCompanyId,
        'JOB_REQUISITION',
        'JOB',
      );
      expect(prisma.jobRequisition.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'DRAFT',
            jobCode: 'JOB-2026-0001',
            manpowerRequisitionId: 'm-1',
          }),
        }),
      );
    });
  });

  describe('createDirectJob (Exception Path)', () => {
    it('should forbid non-HR/Admin roles from creating direct jobs', async () => {
      await expect(
        service.createDirectJob(mockCompanyId, mockUserManager, {
          title: 'Direct Hire Dev',
          departmentId: 'dept-1',
          location: 'Guwahati',
          openings: 1,
          description: 'Desc',
          responsibilities: 'Resp',
          requirements: 'Reqs',
          directHiringReason: DirectJobReasonEnum.EMERGENCY_HIRE,
          directHiringJustification: 'Critical replacement',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if directHiringJustification is missing', async () => {
      await expect(
        service.createDirectJob(mockCompanyId, mockUserAdmin, {
          title: 'Direct Hire Dev',
          departmentId: 'dept-1',
          location: 'Guwahati',
          openings: 1,
          description: 'Desc',
          responsibilities: 'Resp',
          requirements: 'Reqs',
          directHiringReason: DirectJobReasonEnum.EMERGENCY_HIRE,
          directHiringJustification: '',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Lifecycle State Transitions', () => {
    it('submitForApproval should transition from DRAFT to PENDING_APPROVAL', async () => {
      prisma.jobRequisition.findFirst.mockResolvedValue({
        id: 'job-1',
        status: 'DRAFT',
      });
      prisma.jobRequisition.update.mockResolvedValue({
        id: 'job-1',
        status: 'PENDING_APPROVAL',
      });

      const result = await service.submitForApproval(
        mockCompanyId,
        'job-1',
        mockUserManager,
      );
      expect(result.status).toBe('PENDING_APPROVAL');
      expect(prisma.jobRequisition.update).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        data: expect.objectContaining({ status: 'PENDING_APPROVAL' }),
      });
    });

    it('approveJob should transition from PENDING_APPROVAL to APPROVED for HR', async () => {
      prisma.jobRequisition.findFirst.mockResolvedValue({
        id: 'job-1',
        status: 'PENDING_APPROVAL',
      });
      prisma.jobRequisition.update.mockResolvedValue({
        id: 'job-1',
        status: 'APPROVED',
      });

      const result = await service.approveJob(
        mockCompanyId,
        'job-1',
        mockUserAdmin,
      );
      expect(result.status).toBe('APPROVED');
    });

    it('publishJob should transition from APPROVED to PUBLISHED for HR', async () => {
      prisma.jobRequisition.findFirst.mockResolvedValue({
        id: 'job-1',
        status: 'APPROVED',
      });
      prisma.jobRequisition.update.mockResolvedValue({
        id: 'job-1',
        status: 'PUBLISHED',
      });

      const result = await service.publishJob(
        mockCompanyId,
        'job-1',
        mockUserAdmin,
      );
      expect(result.status).toBe('PUBLISHED');
    });

    it('publishJob should throw if status is not APPROVED', async () => {
      prisma.jobRequisition.findFirst.mockResolvedValue({
        id: 'job-1',
        status: 'DRAFT',
      });

      await expect(
        service.publishJob(mockCompanyId, 'job-1', mockUserAdmin),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
