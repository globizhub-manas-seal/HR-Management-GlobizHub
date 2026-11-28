import { Test, TestingModule } from '@nestjs/testing';
import { OnboardingService } from './onboarding.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('OnboardingService', () => {
  let service: OnboardingService;
  let prisma: any;
  let auditService: any;

  beforeEach(async () => {
    prisma = {
      onboardingTemplate: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      onboardingCase: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
      },
      task: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      employee: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };

    auditService = {
      logAction: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<OnboardingService>(OnboardingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTemplate', () => {
    it('should create an onboarding template and log audit', async () => {
      const mockTemplate = {
        id: 'tpl-1',
        companyId: 'comp-1',
        name: 'Engineering Onboarding',
        departmentId: 'dept-1',
        roleId: null,
        taskChecklist: [{ title: 'Setup GitHub' }],
        documentChecklist: [],
      };

      prisma.onboardingTemplate.create.mockResolvedValue(mockTemplate);

      const result = await service.createTemplate(
        'comp-1',
        {
          name: 'Engineering Onboarding',
          departmentId: 'dept-1',
          taskChecklist: [{ title: 'Setup GitHub' }],
        },
        'user-1',
      );

      expect(result).toEqual(mockTemplate);
      expect(prisma.onboardingTemplate.create).toHaveBeenCalled();
      expect(auditService.logAction).toHaveBeenCalled();
    });
  });

  describe('getAllCases', () => {
    it('should return all cases with computed metrics', async () => {
      const mockCases = [
        {
          id: 'case-1',
          companyId: 'comp-1',
          status: 'IN_PROGRESS',
          employee: { id: 'emp-1', firstName: 'Jane', lastName: 'Doe' },
          template: { id: 'tpl-1', name: 'Standard' },
          tasks: [
            {
              id: 't-1',
              title: 'Task 1',
              status: 'COMPLETED',
              requiredForActivation: true,
            },
            {
              id: 't-2',
              title: 'Task 2',
              status: 'PENDING',
              requiredForActivation: true,
            },
          ],
          documents: [{ id: 'd-1', name: 'ID Proof', status: 'VERIFIED' }],
        },
      ];

      prisma.employee.findMany.mockResolvedValue([]);
      prisma.onboardingCase.findMany.mockResolvedValue(mockCases);

      const result = await service.getAllCases('comp-1');

      expect(result).toHaveLength(1);
      expect(result[0].metrics).toEqual({
        totalTasks: 2,
        completedTasks: 1,
        progressPercent: 50,
        totalDocuments: 1,
        verifiedDocuments: 1,
      });
    });
  });

  describe('signOffer', () => {
    it('should mark offer as signed and update status', async () => {
      const mockCase = {
        id: 'case-1',
        companyId: 'comp-1',
        employeeId: 'emp-1',
        status: 'INVITED',
        offerSigned: false,
      };

      prisma.onboardingCase.findUnique.mockResolvedValue(mockCase);
      prisma.onboardingCase.update.mockResolvedValue({
        ...mockCase,
        status: 'OFFER_ACCEPTED',
        offerSigned: true,
      });
      prisma.task.findFirst.mockResolvedValue(null);

      const result = await service.signOffer('emp-1');

      expect(result.offerSigned).toBe(true);
      expect(result.status).toBe('OFFER_ACCEPTED');
      expect(auditService.logAction).toHaveBeenCalled();
    });
  });

  describe('toggleTask', () => {
    it('should toggle task status between PENDING and COMPLETED', async () => {
      const mockTask = {
        id: 'task-1',
        employeeId: 'emp-1',
        status: 'PENDING',
      };

      prisma.task.findUnique.mockResolvedValue(mockTask);
      prisma.task.update.mockResolvedValue({
        ...mockTask,
        status: 'COMPLETED',
      });
      prisma.onboardingCase.findUnique.mockResolvedValue(null);

      const result = await service.toggleTask('emp-1', 'task-1');

      expect(result.status).toBe('COMPLETED');
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: { status: 'COMPLETED' },
      });
    });
  });
});
