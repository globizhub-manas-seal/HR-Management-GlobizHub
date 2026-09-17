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
  CreateManpowerRequisitionDto,
  RecruitmentEmploymentTypeEnum,
} from '../dto/create-manpower-requisition.dto';
import { UpdateManpowerRequisitionDto } from '../dto/update-manpower-requisition.dto';
import {
  ApproveRequisitionDto,
  RequestChangesDto,
  RejectRequisitionDto,
} from '../dto/review-manpower-requisition.dto';

const HR_PRIVILEGED_ROLES = ['SUPER_ADMIN', 'OWNER', 'HR_HEAD'];

@Injectable()
export class ManpowerRequisitionService {
  constructor(
    private prisma: PrismaService,
    private sequenceService: SequenceService,
    private auditService: AuditService,
  ) {}

  private checkHRPermission(role: string) {
    if (!HR_PRIVILEGED_ROLES.includes(role)) {
      throw new ForbiddenException(
        'Access denied: Only HR Head, Super Admin, or Owner can perform this review action.',
      );
    }
  }

  // 1. Create Draft Manpower Requisition
  async createRequisition(
    companyId: string,
    user: any,
    dto: CreateManpowerRequisitionDto,
  ) {
    // Validate department
    const dept = await this.prisma.department.findFirst({
      where: { id: dto.departmentId, companyId },
    });
    if (!dept) {
      throw new BadRequestException(
        'Department does not exist or does not belong to this company.',
      );
    }

    // Validate designation
    const designation = await this.prisma.designation.findFirst({
      where: { id: dto.designationId, companyId },
    });
    if (!designation) {
      throw new BadRequestException(
        'Designation does not exist or does not belong to this company.',
      );
    }

    // If replacement, validate replacement employee
    if (dto.replacementForId) {
      const replacementEmp = await this.prisma.employee.findFirst({
        where: { id: dto.replacementForId, companyId },
      });
      if (!replacementEmp) {
        throw new BadRequestException(
          'Replacement employee not found in this company.',
        );
      }
    }

    // Generate atomic sequence code
    const requisitionNumber = await this.sequenceService.getNextSequence(
      companyId,
      'MANPOWER_REQUISITION',
      'MR',
    );

    const requisition = await this.prisma.manpowerRequisition.create({
      data: {
        companyId,
        requisitionNumber,
        departmentId: dto.departmentId,
        designationId: dto.designationId,
        requestedById: user.sub,
        positionsCount: dto.positionsCount,
        employmentType: (dto.employmentType ||
          RecruitmentEmploymentTypeEnum.FULL_TIME) as any,
        location: dto.location,
        hiringReason: dto.hiringReason as any,
        replacementForId: dto.replacementForId || null,
        requiredSkills: dto.requiredSkills || [],
        minExperienceYears: dto.minExperienceYears || 0,
        maxExperienceYears: dto.maxExperienceYears || null,
        minSalary: dto.minSalary ? (dto.minSalary as any) : null,
        maxSalary: dto.maxSalary ? (dto.maxSalary as any) : null,
        currency: dto.currency || 'INR',
        expectedJoiningDate: dto.expectedJoiningDate
          ? new Date(dto.expectedJoiningDate)
          : null,
        justification: dto.justification || null,
        isBudgeted: dto.isBudgeted ?? true,
        budgetAmount: dto.budgetAmount ? (dto.budgetAmount as any) : null,
        status: 'DRAFT',
        updatedById: user.sub,
      },
      include: {
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, name: true } },
        requestedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    await this.auditService.logAction(
      companyId,
      user.sub,
      'CREATE',
      'ManpowerRequisition',
      requisition.id,
      null,
      { requisitionNumber, status: 'DRAFT' },
    );

    return requisition;
  }

  // 2. List Requisitions (Tenant Isolated & Role Filtered)
  async getRequisitions(
    companyId: string,
    user: any,
    filters?: { status?: string; departmentId?: string; search?: string },
  ) {
    const where: any = { companyId };

    // Regular employees see only what they requested
    if (user.role === 'EMPLOYEE') {
      where.requestedById = user.sub;
    }

    if (filters?.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }

    if (filters?.departmentId && filters.departmentId !== 'ALL') {
      where.departmentId = filters.departmentId;
    }

    if (filters?.search) {
      where.OR = [
        {
          requisitionNumber: { contains: filters.search, mode: 'insensitive' },
        },
        {
          department: {
            name: { contains: filters.search, mode: 'insensitive' },
          },
        },
        {
          designation: {
            name: { contains: filters.search, mode: 'insensitive' },
          },
        },
      ];
    }

    return this.prisma.manpowerRequisition.findMany({
      where,
      include: {
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, name: true } },
        requestedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        approvedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: { select: { approvals: true, jobRequisitions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 3. Get Single Requisition Details with Full History
  async getRequisitionById(companyId: string, id: string) {
    const req = await this.prisma.manpowerRequisition.findFirst({
      where: { id, companyId },
      include: {
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, name: true } },
        requestedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        replacementFor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        approvedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        updatedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        approvals: {
          include: {
            performedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        jobRequisitions: {
          select: {
            id: true,
            jobCode: true,
            title: true,
            status: true,
            openings: true,
            filledCount: true,
            createdAt: true,
          },
        },
      },
    });

    if (!req) {
      throw new NotFoundException('Manpower requisition not found');
    }

    return req;
  }

  // 4. Update Requisition (Only allowed in DRAFT or CHANGES_REQUESTED)
  async updateRequisition(
    companyId: string,
    id: string,
    user: any,
    dto: UpdateManpowerRequisitionDto,
  ) {
    const existing = await this.prisma.manpowerRequisition.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      throw new NotFoundException('Manpower requisition not found');
    }

    if (
      existing.status !== 'DRAFT' &&
      existing.status !== 'CHANGES_REQUESTED'
    ) {
      throw new BadRequestException(
        `Cannot edit requisition in '${existing.status}' status. Only DRAFT or CHANGES_REQUESTED can be modified.`,
      );
    }

    // Role check: non-HR can only modify their own
    if (
      !HR_PRIVILEGED_ROLES.includes(user.role) &&
      existing.requestedById !== user.sub
    ) {
      throw new ForbiddenException('You can only edit your own requisitions.');
    }

    const updated = await this.prisma.manpowerRequisition.update({
      where: { id },
      data: {
        departmentId: dto.departmentId,
        designationId: dto.designationId,
        positionsCount: dto.positionsCount,
        employmentType: dto.employmentType as any,
        location: dto.location,
        hiringReason: dto.hiringReason as any,
        replacementForId: dto.replacementForId,
        requiredSkills: dto.requiredSkills,
        minExperienceYears: dto.minExperienceYears,
        maxExperienceYears: dto.maxExperienceYears,
        minSalary: dto.minSalary ? (dto.minSalary as any) : undefined,
        maxSalary: dto.maxSalary ? (dto.maxSalary as any) : undefined,
        currency: dto.currency,
        expectedJoiningDate: dto.expectedJoiningDate
          ? new Date(dto.expectedJoiningDate)
          : undefined,
        justification: dto.justification,
        isBudgeted: dto.isBudgeted,
        budgetAmount: dto.budgetAmount ? (dto.budgetAmount as any) : undefined,
        updatedById: user.sub,
      },
    });

    await this.auditService.logAction(
      companyId,
      user.sub,
      'UPDATE',
      'ManpowerRequisition',
      id,
      existing,
      updated,
    );

    return updated;
  }

  // 5. Submit Requisition (DRAFT or CHANGES_REQUESTED -> SUBMITTED)
  async submitRequisition(companyId: string, id: string, user: any) {
    const existing = await this.prisma.manpowerRequisition.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      throw new NotFoundException('Manpower requisition not found');
    }

    if (
      existing.status !== 'DRAFT' &&
      existing.status !== 'CHANGES_REQUESTED'
    ) {
      throw new BadRequestException(
        `Cannot submit requisition from '${existing.status}' status. Must be DRAFT or CHANGES_REQUESTED.`,
      );
    }

    if (
      !HR_PRIVILEGED_ROLES.includes(user.role) &&
      existing.requestedById !== user.sub
    ) {
      throw new ForbiddenException('You can only submit your own requisition.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.manpowerRequisition.update({
        where: { id },
        data: {
          status: 'SUBMITTED',
          updatedById: user.sub,
        },
      });

      await tx.requisitionApproval.create({
        data: {
          companyId,
          requisitionId: id,
          action: 'SUBMITTED',
          performedById: user.sub,
          comments:
            existing.status === 'CHANGES_REQUESTED'
              ? 'Re-submitted after updates'
              : 'Submitted for review',
        },
      });

      return res;
    });

    await this.auditService.logAction(
      companyId,
      user.sub,
      'UPDATE',
      'ManpowerRequisition',
      id,
      { status: existing.status },
      { status: 'SUBMITTED' },
    );

    return updated;
  }

  // 6. Start Review (SUBMITTED -> UNDER_REVIEW)
  async startReview(companyId: string, id: string, user: any) {
    this.checkHRPermission(user.role);

    const existing = await this.prisma.manpowerRequisition.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      throw new NotFoundException('Manpower requisition not found');
    }

    if (existing.status !== 'SUBMITTED') {
      throw new BadRequestException(
        `Cannot start review on requisition with status '${existing.status}'. Must be SUBMITTED.`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.manpowerRequisition.update({
        where: { id },
        data: {
          status: 'UNDER_REVIEW',
          updatedById: user.sub,
        },
      });

      await tx.requisitionApproval.create({
        data: {
          companyId,
          requisitionId: id,
          action: 'UNDER_REVIEW',
          performedById: user.sub,
          comments: 'Review initiated by HR/Management',
        },
      });

      return res;
    });

    await this.auditService.logAction(
      companyId,
      user.sub,
      'UPDATE',
      'ManpowerRequisition',
      id,
      { status: 'SUBMITTED' },
      { status: 'UNDER_REVIEW' },
    );

    return updated;
  }

  // 7. Request Changes (UNDER_REVIEW -> CHANGES_REQUESTED)
  async requestChanges(
    companyId: string,
    id: string,
    user: any,
    dto: RequestChangesDto,
  ) {
    this.checkHRPermission(user.role);

    const existing = await this.prisma.manpowerRequisition.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      throw new NotFoundException('Manpower requisition not found');
    }

    if (existing.status !== 'UNDER_REVIEW') {
      throw new BadRequestException(
        `Cannot request changes on requisition with status '${existing.status}'. It must be UNDER_REVIEW first.`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.manpowerRequisition.update({
        where: { id },
        data: {
          status: 'CHANGES_REQUESTED',
          updatedById: user.sub,
        },
      });

      await tx.requisitionApproval.create({
        data: {
          companyId,
          requisitionId: id,
          action: 'CHANGES_REQUESTED',
          performedById: user.sub,
          comments: dto.comments,
        },
      });

      return res;
    });

    await this.auditService.logAction(
      companyId,
      user.sub,
      'UPDATE',
      'ManpowerRequisition',
      id,
      { status: 'UNDER_REVIEW' },
      { status: 'CHANGES_REQUESTED', comments: dto.comments },
    );

    return updated;
  }

  // 8. Approve Requisition (UNDER_REVIEW -> APPROVED)
  async approveRequisition(
    companyId: string,
    id: string,
    user: any,
    dto: ApproveRequisitionDto,
  ) {
    this.checkHRPermission(user.role);

    const existing = await this.prisma.manpowerRequisition.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      throw new NotFoundException('Manpower requisition not found');
    }

    if (existing.status !== 'UNDER_REVIEW') {
      throw new BadRequestException(
        `Cannot approve requisition with status '${existing.status}'. It must be UNDER_REVIEW first (run startReview).`,
      );
    }

    const budgetToSet =
      dto.budgetAmount !== undefined
        ? (dto.budgetAmount as any)
        : existing.budgetAmount;

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.manpowerRequisition.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedById: user.sub,
          approvedAt: new Date(),
          budgetAmount: budgetToSet,
          updatedById: user.sub,
        },
      });

      await tx.requisitionApproval.create({
        data: {
          companyId,
          requisitionId: id,
          action: 'APPROVED',
          performedById: user.sub,
          comments: dto.comments || 'Requisition and budget approved.',
          budgetAmount: budgetToSet,
        },
      });

      return res;
    });

    await this.auditService.logAction(
      companyId,
      user.sub,
      'APPROVE',
      'ManpowerRequisition',
      id,
      { status: 'UNDER_REVIEW' },
      { status: 'APPROVED', budgetAmount: budgetToSet },
    );

    return updated;
  }

  // 9. Reject Requisition (UNDER_REVIEW -> REJECTED)
  async rejectRequisition(
    companyId: string,
    id: string,
    user: any,
    dto: RejectRequisitionDto,
  ) {
    this.checkHRPermission(user.role);

    const existing = await this.prisma.manpowerRequisition.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      throw new NotFoundException('Manpower requisition not found');
    }

    if (existing.status !== 'UNDER_REVIEW') {
      throw new BadRequestException(
        `Cannot reject requisition with status '${existing.status}'. It must be UNDER_REVIEW first.`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.manpowerRequisition.update({
        where: { id },
        data: {
          status: 'REJECTED',
          updatedById: user.sub,
        },
      });

      await tx.requisitionApproval.create({
        data: {
          companyId,
          requisitionId: id,
          action: 'REJECTED',
          performedById: user.sub,
          comments: dto.comments,
        },
      });

      return res;
    });

    await this.auditService.logAction(
      companyId,
      user.sub,
      'REJECT',
      'ManpowerRequisition',
      id,
      { status: 'UNDER_REVIEW' },
      { status: 'REJECTED', comments: dto.comments },
    );

    return updated;
  }

  // 10. Cancel Requisition
  async cancelRequisition(
    companyId: string,
    id: string,
    user: any,
    comments?: string,
  ) {
    const existing = await this.prisma.manpowerRequisition.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      throw new NotFoundException('Manpower requisition not found');
    }

    if (
      existing.status === 'APPROVED' ||
      existing.status === 'REJECTED' ||
      existing.status === 'CANCELLED'
    ) {
      throw new BadRequestException(
        `Cannot cancel requisition already in '${existing.status}' status.`,
      );
    }

    if (
      !HR_PRIVILEGED_ROLES.includes(user.role) &&
      existing.requestedById !== user.sub
    ) {
      throw new ForbiddenException('You can only cancel your own requisition.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.manpowerRequisition.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          updatedById: user.sub,
        },
      });

      await tx.requisitionApproval.create({
        data: {
          companyId,
          requisitionId: id,
          action: 'CANCELLED',
          performedById: user.sub,
          comments: comments || 'Requisition cancelled by requester/admin',
        },
      });

      return res;
    });

    await this.auditService.logAction(
      companyId,
      user.sub,
      'UPDATE',
      'ManpowerRequisition',
      id,
      { status: existing.status },
      { status: 'CANCELLED' },
    );

    return updated;
  }

  // 11. Dashboard KPIs
  async getDashboardStats(companyId: string) {
    const [openRequisitions, pendingApprovals, jobs] = await Promise.all([
      this.prisma.manpowerRequisition.count({
        where: {
          companyId,
          status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'] },
        },
      }),
      this.prisma.manpowerRequisition.count({
        where: {
          companyId,
          status: { in: ['SUBMITTED', 'UNDER_REVIEW'] },
        },
      }),
      this.prisma.jobRequisition.findMany({
        where: {
          companyId,
          status: { in: ['APPROVED', 'PUBLISHED'] },
        },
        select: { openings: true, filledCount: true },
      }),
    ]);

    const openPositions = jobs.reduce(
      (sum, j) => sum + (j.openings - j.filledCount),
      0,
    );
    const positionsFilled = jobs.reduce((sum, j) => sum + j.filledCount, 0);

    return {
      openRequisitions,
      pendingApprovals,
      openPositions,
      positionsFilled,
    };
  }
}
