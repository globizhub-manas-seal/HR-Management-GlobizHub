import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SequenceService } from './sequence.service';
import { AuditService } from '../../audit/audit.service';
import {
  CreateJobRequisitionDto,
  WorkplaceTypeEnum,
} from '../dto/create-job-requisition.dto';
import { UpdateJobRequisitionDto } from '../dto/update-job-requisition.dto';

const HR_PRIVILEGED_ROLES = ['SUPER_ADMIN', 'OWNER', 'HR_HEAD'];

@Injectable()
export class JobRequisitionService {
  constructor(
    private prisma: PrismaService,
    private sequenceService: SequenceService,
    private auditService: AuditService,
  ) {}

  private checkHRPermission(role: string) {
    if (!HR_PRIVILEGED_ROLES.includes(role)) {
      throw new ForbiddenException(
        'Access denied: Only HR Head, Super Admin, or Owner can perform this action.',
      );
    }
  }

  // 1. Create Job from Approved Manpower Requisition (Normal Path)
  async createFromManpowerRequisition(
    companyId: string,
    user: any,
    dto: CreateJobRequisitionDto,
  ) {
    if (!dto.manpowerRequisitionId) {
      throw new BadRequestException(
        'manpowerRequisitionId is required for this action.',
      );
    }

    const manpowerReq = await this.prisma.manpowerRequisition.findFirst({
      where: { id: dto.manpowerRequisitionId, companyId },
      include: {
        department: true,
        designation: true,
      },
    });

    if (!manpowerReq) {
      throw new NotFoundException('Manpower requisition not found');
    }

    if (manpowerReq.status !== 'APPROVED') {
      throw new BadRequestException(
        `Cannot create job requisition from a manpower request in '${manpowerReq.status}' status. It must be APPROVED first.`,
      );
    }

    // Duplicate Check: ensure no active job already exists for this manpower requisition
    const existingActiveJob = await this.prisma.jobRequisition.findFirst({
      where: {
        companyId,
        manpowerRequisitionId: dto.manpowerRequisitionId,
        status: { notIn: ['CANCELLED', 'CLOSED'] },
      },
    });

    if (existingActiveJob) {
      throw new BadRequestException(
        `An active job requisition (${existingActiveJob.jobCode}) already exists for this manpower requisition.`,
      );
    }

    // Atomic Job Code Generation
    const jobCode = await this.sequenceService.getNextSequence(
      companyId,
      'JOB_REQUISITION',
      'JOB',
    );

    // Deep copy / snapshot isolation from approved manpower request
    const job = await this.prisma.jobRequisition.create({
      data: {
        companyId,
        jobCode,
        manpowerRequisitionId: manpowerReq.id,
        title:
          dto.title ||
          `${manpowerReq.designation.name} - ${manpowerReq.department.name}`,
        departmentId: manpowerReq.departmentId,
        designationId: manpowerReq.designationId,
        location: dto.location || manpowerReq.location || 'Remote',
        workplaceType: (dto.workplaceType || WorkplaceTypeEnum.ON_SITE) as any,
        employmentType: manpowerReq.employmentType,
        openings: dto.openings || manpowerReq.positionsCount,
        filledCount: 0,
        description: dto.description,
        responsibilities: dto.responsibilities,
        requirements: dto.requirements,
        skills:
          dto.skills && dto.skills.length > 0
            ? dto.skills
            : manpowerReq.requiredSkills,
        screeningQuestions: (dto.screeningQuestions as any) || [],
        salaryMin:
          dto.salaryMin !== undefined
            ? (dto.salaryMin as any)
            : manpowerReq.minSalary,
        salaryMax:
          dto.salaryMax !== undefined
            ? (dto.salaryMax as any)
            : manpowerReq.maxSalary,
        showSalaryRange: dto.showSalaryRange ?? false,
        applicationDeadline: dto.applicationDeadline
          ? new Date(dto.applicationDeadline)
          : null,
        status: 'DRAFT',
        createdById: user.sub,
        updatedById: user.sub,
      },
      include: {
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, name: true } },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    await this.auditService.logAction(
      companyId,
      user.sub,
      'CREATE',
      'JobRequisition',
      job.id,
      null,
      { jobCode, fromManpowerId: manpowerReq.id },
    );

    return job;
  }

  // 2. Create Direct Job (Role Restricted Exception Path)
  async createDirectJob(
    companyId: string,
    user: any,
    dto: CreateJobRequisitionDto,
  ) {
    this.checkHRPermission(user.role);

    if (!dto.directHiringReason) {
      throw new BadRequestException(
        'Direct job creation requires a valid directHiringReason (DIRECT_HIRE, REPLACEMENT, EMERGENCY_HIRE, INTERNAL_POSITION).',
      );
    }

    if (
      !dto.directHiringJustification ||
      dto.directHiringJustification.trim().length === 0
    ) {
      throw new BadRequestException(
        'Direct job creation requires a directHiringJustification explaining why a manpower requisition was bypassed.',
      );
    }

    // Validate department
    const dept = await this.prisma.department.findFirst({
      where: { id: dto.departmentId, companyId },
    });
    if (!dept) {
      throw new BadRequestException(
        'Department does not exist or does not belong to this company.',
      );
    }

    const jobCode = await this.sequenceService.getNextSequence(
      companyId,
      'JOB_REQUISITION',
      'JOB',
    );

    const job = await this.prisma.jobRequisition.create({
      data: {
        companyId,
        jobCode,
        directHiringReason: dto.directHiringReason as any,
        directHiringJustification: dto.directHiringJustification,
        title: dto.title,
        departmentId: dto.departmentId,
        designationId: dto.designationId || null,
        location: dto.location,
        workplaceType: (dto.workplaceType || WorkplaceTypeEnum.ON_SITE) as any,
        employmentType: (dto.employmentType as any) || 'FULL_TIME',
        openings: dto.openings || 1,
        filledCount: 0,
        description: dto.description,
        responsibilities: dto.responsibilities,
        requirements: dto.requirements,
        skills: dto.skills || [],
        screeningQuestions: (dto.screeningQuestions as any) || [],
        salaryMin: dto.salaryMin ? (dto.salaryMin as any) : null,
        salaryMax: dto.salaryMax ? (dto.salaryMax as any) : null,
        showSalaryRange: dto.showSalaryRange ?? false,
        applicationDeadline: dto.applicationDeadline
          ? new Date(dto.applicationDeadline)
          : null,
        status: 'DRAFT',
        createdById: user.sub,
        updatedById: user.sub,
      },
      include: {
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, name: true } },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    await this.auditService.logAction(
      companyId,
      user.sub,
      'CREATE',
      'JobRequisition',
      job.id,
      null,
      { jobCode, directHiringReason: dto.directHiringReason },
    );

    return job;
  }

  // 3. List Jobs
  async getJobs(
    companyId: string,
    filters?: { status?: string; departmentId?: string; search?: string },
  ) {
    const where: any = { companyId };

    if (filters?.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }

    if (filters?.departmentId && filters.departmentId !== 'ALL') {
      where.departmentId = filters.departmentId;
    }

    if (filters?.search) {
      where.OR = [
        { jobCode: { contains: filters.search, mode: 'insensitive' } },
        { title: { contains: filters.search, mode: 'insensitive' } },
        {
          department: {
            name: { contains: filters.search, mode: 'insensitive' },
          },
        },
      ];
    }

    return this.prisma.jobRequisition.findMany({
      where,
      include: {
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, name: true } },
        manpowerRequisition: {
          select: {
            id: true,
            requisitionNumber: true,
            hiringReason: true,
            positionsCount: true,
          },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        approvedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 4. Get Job by ID
  async getJobById(companyId: string, id: string) {
    const job = await this.prisma.jobRequisition.findFirst({
      where: { id, companyId },
      include: {
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, name: true } },
        manpowerRequisition: {
          select: {
            id: true,
            requisitionNumber: true,
            hiringReason: true,
            positionsCount: true,
            budgetAmount: true,
            justification: true,
          },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        approvedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        updatedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Job requisition not found');
    }

    return job;
  }

  // 5. Update Job Details
  async updateJob(
    companyId: string,
    id: string,
    user: any,
    dto: UpdateJobRequisitionDto,
  ) {
    const existing = await this.prisma.jobRequisition.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      throw new NotFoundException('Job requisition not found');
    }

    if (existing.status !== 'DRAFT' && existing.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(
        `Cannot modify job in '${existing.status}' status. Must be DRAFT or PENDING_APPROVAL.`,
      );
    }

    const updated = await this.prisma.jobRequisition.update({
      where: { id },
      data: {
        title: dto.title,
        departmentId: dto.departmentId,
        designationId: dto.designationId,
        location: dto.location,
        workplaceType: dto.workplaceType as any,
        employmentType: dto.employmentType as any,
        openings: dto.openings,
        description: dto.description,
        responsibilities: dto.responsibilities,
        requirements: dto.requirements,
        skills: dto.skills,
        screeningQuestions: dto.screeningQuestions
          ? (dto.screeningQuestions as any)
          : undefined,
        salaryMin:
          dto.salaryMin !== undefined ? (dto.salaryMin as any) : undefined,
        salaryMax:
          dto.salaryMax !== undefined ? (dto.salaryMax as any) : undefined,
        showSalaryRange: dto.showSalaryRange,
        applicationDeadline: dto.applicationDeadline
          ? new Date(dto.applicationDeadline)
          : undefined,
        updatedById: user.sub,
      },
    });

    await this.auditService.logAction(
      companyId,
      user.sub,
      'UPDATE',
      'JobRequisition',
      id,
      existing,
      updated,
    );

    return updated;
  }

  // 6. Submit Job for Approval (DRAFT -> PENDING_APPROVAL)
  async submitForApproval(companyId: string, id: string, user: any) {
    const existing = await this.prisma.jobRequisition.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      throw new NotFoundException('Job requisition not found');
    }

    if (existing.status !== 'DRAFT') {
      throw new BadRequestException(
        `Cannot submit job for approval from '${existing.status}' status. Must be DRAFT.`,
      );
    }

    const updated = await this.prisma.jobRequisition.update({
      where: { id },
      data: {
        status: 'PENDING_APPROVAL',
        updatedById: user.sub,
      },
    });

    await this.auditService.logAction(
      companyId,
      user.sub,
      'UPDATE',
      'JobRequisition',
      id,
      { status: 'DRAFT' },
      { status: 'PENDING_APPROVAL' },
    );

    return updated;
  }

  // 7. Approve Job (PENDING_APPROVAL -> APPROVED)
  async approveJob(companyId: string, id: string, user: any) {
    this.checkHRPermission(user.role);

    const existing = await this.prisma.jobRequisition.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      throw new NotFoundException('Job requisition not found');
    }

    if (existing.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(
        `Cannot approve job with status '${existing.status}'. Must be PENDING_APPROVAL.`,
      );
    }

    const updated = await this.prisma.jobRequisition.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: user.sub,
        approvedAt: new Date(),
        updatedById: user.sub,
      },
    });

    await this.auditService.logAction(
      companyId,
      user.sub,
      'APPROVE',
      'JobRequisition',
      id,
      { status: 'PENDING_APPROVAL' },
      { status: 'APPROVED' },
    );

    return updated;
  }

  // 8. Publish Job (APPROVED -> PUBLISHED)
  async publishJob(companyId: string, id: string, user: any) {
    this.checkHRPermission(user.role);

    const existing = await this.prisma.jobRequisition.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      throw new NotFoundException('Job requisition not found');
    }

    if (existing.status !== 'APPROVED') {
      throw new BadRequestException(
        `Cannot publish job with status '${existing.status}'. Must be APPROVED first.`,
      );
    }

    const updated = await this.prisma.jobRequisition.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        updatedById: user.sub,
      },
    });

    await this.auditService.logAction(
      companyId,
      user.sub,
      'UPDATE',
      'JobRequisition',
      id,
      { status: 'APPROVED' },
      { status: 'PUBLISHED' },
    );

    return updated;
  }

  // 9. Pause Job (PUBLISHED -> PAUSED)
  async pauseJob(companyId: string, id: string, user: any) {
    this.checkHRPermission(user.role);

    const existing = await this.prisma.jobRequisition.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      throw new NotFoundException('Job requisition not found');
    }

    if (existing.status !== 'PUBLISHED') {
      throw new BadRequestException(
        `Cannot pause job with status '${existing.status}'. Must be PUBLISHED.`,
      );
    }

    const updated = await this.prisma.jobRequisition.update({
      where: { id },
      data: {
        status: 'PAUSED',
        updatedById: user.sub,
      },
    });

    await this.auditService.logAction(
      companyId,
      user.sub,
      'UPDATE',
      'JobRequisition',
      id,
      { status: 'PUBLISHED' },
      { status: 'PAUSED' },
    );

    return updated;
  }

  // 10. Resume Job (PAUSED -> PUBLISHED)
  async resumeJob(companyId: string, id: string, user: any) {
    this.checkHRPermission(user.role);

    const existing = await this.prisma.jobRequisition.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      throw new NotFoundException('Job requisition not found');
    }

    if (existing.status !== 'PAUSED') {
      throw new BadRequestException(
        `Cannot resume job with status '${existing.status}'. Must be PAUSED.`,
      );
    }

    const updated = await this.prisma.jobRequisition.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        updatedById: user.sub,
      },
    });

    await this.auditService.logAction(
      companyId,
      user.sub,
      'UPDATE',
      'JobRequisition',
      id,
      { status: 'PAUSED' },
      { status: 'PUBLISHED' },
    );

    return updated;
  }

  // 11. Close Job (PUBLISHED | PAUSED -> CLOSED)
  async closeJob(companyId: string, id: string, user: any) {
    this.checkHRPermission(user.role);

    const existing = await this.prisma.jobRequisition.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      throw new NotFoundException('Job requisition not found');
    }

    if (existing.status !== 'PUBLISHED' && existing.status !== 'PAUSED') {
      throw new BadRequestException(
        `Cannot close job with status '${existing.status}'. Must be PUBLISHED or PAUSED.`,
      );
    }

    const updated = await this.prisma.jobRequisition.update({
      where: { id },
      data: {
        status: 'CLOSED',
        updatedById: user.sub,
      },
    });

    await this.auditService.logAction(
      companyId,
      user.sub,
      'UPDATE',
      'JobRequisition',
      id,
      { status: existing.status },
      { status: 'CLOSED' },
    );

    return updated;
  }
}
