import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { AuditService } from '../audit/audit.service';
import { CreateResignationDto } from './dto/create-resignation.dto';
import { ReviewResignationDto } from './dto/review-resignation.dto';
import { UpdateClearanceDto } from './dto/update-clearance.dto';
import { FinalizeResignationDto } from './dto/finalize-resignation.dto';

const DEFAULT_CLEARANCE = {
  assets: { completed: false, notes: '' },
  it: { completed: false, notes: '' },
  finance: { completed: false, notes: '' },
  hr: { completed: false, notes: '' },
};

@Injectable()
export class ResignationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly auditService: AuditService,
  ) {}

  // 1. Employee applies for resignation
  async applyResignation(
    employeeId: string,
    companyId: string,
    dto: CreateResignationDto,
  ) {
    // Check if employee has an active resignation
    const existingActive = await this.prisma.resignationRequest.findFirst({
      where: {
        employeeId,
        status: { in: ['PENDING', 'UNDER_REVIEW', 'APPROVED'] },
      },
    });

    if (existingActive) {
      throw new BadRequestException(
        'You already have an active resignation request pending or approved.',
      );
    }

    // Get company settings for notice period days
    const settings = await this.prisma.companySettings.findUnique({
      where: { companyId },
    });
    const noticePeriodDays = settings?.noticePeriodDays ?? 30;

    // Fetch employee info
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        reportingManagerId: true,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const requestedDate = new Date(dto.requestedLastWorkingDay);

    const resignation = await this.prisma.resignationRequest.create({
      data: {
        companyId,
        employeeId,
        reason: dto.reason,
        reasonDetails: dto.reasonDetails,
        requestedLastWorkingDay: requestedDate,
        noticePeriodDays,
        status: 'PENDING',
        clearanceChecklist: DEFAULT_CLEARANCE,
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            employeeCode: true,
          },
        },
      },
    });

    // Notify Reporting Manager if assigned
    if (employee.reportingManagerId) {
      await this.notificationService.sendInternalNotification(
        companyId,
        employee.reportingManagerId,
        'Resignation Request Submitted',
        `${employee.firstName} ${employee.lastName} has submitted a resignation request.`,
        'SYSTEM',
      );
    }

    // Notify Company HR/Super Admin
    const hrMembers = await this.prisma.employee.findMany({
      where: {
        companyId,
        role: { in: ['HR_HEAD', 'SUPER_ADMIN', 'OWNER'] },
      },
      select: { id: true },
    });

    for (const hr of hrMembers) {
      if (hr.id !== employee.reportingManagerId) {
        await this.notificationService.sendInternalNotification(
          companyId,
          hr.id,
          'New Resignation Application',
          `${employee.firstName} ${employee.lastName} has applied for resignation.`,
          'SYSTEM',
        );
      }
    }

    await this.auditService.logAction(
      companyId,
      employeeId,
      'CREATE',
      'ResignationRequest',
      resignation.id,
      null,
      {
        reason: dto.reason,
        requestedLastWorkingDay: requestedDate.toISOString(),
      },
    );

    return resignation;
  }

  // 2. Fetch employee's own resignation requests
  async getMyResignations(employeeId: string, companyId: string) {
    const [resignations, settings] = await Promise.all([
      this.prisma.resignationRequest.findMany({
        where: { employeeId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.companySettings.findUnique({
        where: { companyId },
        select: { noticePeriodDays: true },
      }),
    ]);

    return {
      resignations,
      activeResignation:
        resignations.find((r) =>
          ['PENDING', 'UNDER_REVIEW', 'APPROVED'].includes(r.status),
        ) || null,
      noticePeriodDays: settings?.noticePeriodDays ?? 30,
    };
  }

  // 3. Withdraw resignation (by employee)
  async withdrawResignation(employeeId: string, resignationId: string) {
    const resignation = await this.prisma.resignationRequest.findFirst({
      where: { id: resignationId, employeeId },
      include: {
        employee: {
          select: { firstName: true, lastName: true, reportingManagerId: true },
        },
      },
    });

    if (!resignation) {
      throw new NotFoundException('Resignation request not found');
    }

    if (!['PENDING', 'UNDER_REVIEW'].includes(resignation.status)) {
      throw new BadRequestException(
        'Resignation cannot be withdrawn once approved or completed.',
      );
    }

    const updated = await this.prisma.resignationRequest.update({
      where: { id: resignationId },
      data: { status: 'WITHDRAWN' },
    });

    // Notify manager
    if (resignation.employee.reportingManagerId) {
      await this.notificationService.sendInternalNotification(
        resignation.companyId,
        resignation.employee.reportingManagerId,
        'Resignation Withdrawn',
        `${resignation.employee.firstName} ${resignation.employee.lastName} has withdrawn their resignation request.`,
        'SYSTEM',
      );
    }

    await this.auditService.logAction(
      resignation.companyId,
      employeeId,
      'UPDATE',
      'ResignationRequest',
      resignationId,
      null,
      { action: 'WITHDRAWN' },
    );

    return updated;
  }

  // 4. Company list for Managers / HR / Admins
  async getCompanyResignations(
    companyId: string,
    user: any,
    statusFilter?: string,
  ) {
    const isHrOrAdmin = ['HR_HEAD', 'SUPER_ADMIN', 'OWNER'].includes(user.role);
    const isManager = user.role === 'MANAGER';

    const where: any = { companyId };

    if (!isHrOrAdmin && isManager) {
      // Direct reports only for standard managers
      where.employee = {
        reportingManagerId: user.sub,
      };
    } else if (!isHrOrAdmin && !isManager) {
      throw new ForbiddenException(
        'You do not have access to company resignations.',
      );
    }

    if (statusFilter && statusFilter !== 'ALL') {
      where.status = statusFilter;
    }

    return this.prisma.resignationRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeCode: true,
            profilePhoto: true,
            employmentStatus: true,
            department: { select: { id: true, name: true } },
            designation: { select: { id: true, name: true, color: true } },
            reportingManager: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 5. Manager Review
  async reviewByManager(
    managerId: string,
    companyId: string,
    resignationId: string,
    dto: ReviewResignationDto,
  ) {
    const resignation = await this.prisma.resignationRequest.findFirst({
      where: { id: resignationId, companyId },
      include: {
        employee: { select: { firstName: true, lastName: true } },
      },
    });

    if (!resignation) {
      throw new NotFoundException('Resignation request not found.');
    }

    const isApproval = dto.decision === 'APPROVED';
    const newStatus = isApproval ? 'UNDER_REVIEW' : 'REJECTED';

    const updated = await this.prisma.resignationRequest.update({
      where: { id: resignationId },
      data: {
        managerId,
        managerDecision: dto.decision,
        managerComment: dto.comment,
        managerDecisionDate: new Date(),
        status: newStatus,
        rejectionReason: !isApproval
          ? dto.rejectionReason || dto.comment
          : null,
      },
    });

    // Notify employee
    await this.notificationService.sendInternalNotification(
      companyId,
      resignation.employeeId,
      `Resignation Update: Manager Review`,
      isApproval
        ? `Your manager has reviewed and recommended your resignation for HR approval.`
        : `Your manager has rejected your resignation request.`,
      'SYSTEM',
    );

    await this.auditService.logAction(
      companyId,
      managerId,
      'UPDATE',
      'ResignationRequest',
      resignationId,
      null,
      { decision: dto.decision, reviewer: 'MANAGER' },
    );

    return updated;
  }

  // 6. HR Review (Final approval into Notice Period or Rejection)
  async reviewByHr(
    hrId: string,
    companyId: string,
    resignationId: string,
    dto: ReviewResignationDto,
  ) {
    const resignation = await this.prisma.resignationRequest.findFirst({
      where: { id: resignationId, companyId },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!resignation) {
      throw new NotFoundException('Resignation request not found.');
    }

    const isApproval = dto.decision === 'APPROVED';

    const approvedLastDay = dto.approvedLastWorkingDay
      ? new Date(dto.approvedLastWorkingDay)
      : resignation.requestedLastWorkingDay;

    const [updated] = await this.prisma.$transaction([
      this.prisma.resignationRequest.update({
        where: { id: resignationId },
        data: {
          hrId,
          hrDecision: dto.decision,
          hrComment: dto.comment,
          hrDecisionDate: new Date(),
          approvedLastWorkingDay: isApproval ? approvedLastDay : null,
          status: isApproval ? 'APPROVED' : 'REJECTED',
          rejectionReason: !isApproval
            ? dto.rejectionReason || dto.comment
            : null,
        },
      }),
      // When approved by HR, employee status transitions to NOTICE_PERIOD
      ...(isApproval
        ? [
            this.prisma.employee.update({
              where: { id: resignation.employeeId },
              data: { employmentStatus: 'NOTICE_PERIOD' },
            }),
          ]
        : []),
    ]);

    // Notify employee
    await this.notificationService.sendInternalNotification(
      companyId,
      resignation.employeeId,
      isApproval ? 'Resignation Approved' : 'Resignation Rejected by HR',
      isApproval
        ? `Your resignation has been officially approved. Your final working day is scheduled for ${approvedLastDay.toLocaleDateString()}.`
        : `Your resignation request has been rejected by HR. Reason: ${dto.rejectionReason || dto.comment || 'N/A'}`,
      'SYSTEM',
    );

    await this.auditService.logAction(
      companyId,
      hrId,
      'UPDATE',
      'ResignationRequest',
      resignationId,
      null,
      { decision: dto.decision, approvedLastWorkingDay: approvedLastDay },
    );

    return updated;
  }

  // 7. Update Clearance Checklist (IT, Assets, Finance, HR)
  async updateClearance(
    userId: string,
    companyId: string,
    resignationId: string,
    dto: UpdateClearanceDto,
  ) {
    const resignation = await this.prisma.resignationRequest.findFirst({
      where: { id: resignationId, companyId },
    });

    if (!resignation) {
      throw new NotFoundException('Resignation request not found.');
    }

    const currentChecklist: any =
      resignation.clearanceChecklist &&
      typeof resignation.clearanceChecklist === 'object'
        ? { ...resignation.clearanceChecklist }
        : { ...DEFAULT_CLEARANCE };

    currentChecklist[dto.department] = {
      completed: dto.completed,
      notes: dto.notes || '',
      updatedBy: userId,
      updatedAt: new Date().toISOString(),
    };

    const updated = await this.prisma.resignationRequest.update({
      where: { id: resignationId },
      data: {
        clearanceChecklist: currentChecklist,
      },
    });

    await this.auditService.logAction(
      companyId,
      userId,
      'UPDATE',
      'ResignationRequest',
      resignationId,
      null,
      { clearanceDepartment: dto.department, completed: dto.completed },
    );

    return updated;
  }

  // 8. Finalize Separation / Offboarding
  async finalizeOffboarding(
    userId: string,
    companyId: string,
    resignationId: string,
    dto?: FinalizeResignationDto,
  ) {
    const resignation = await this.prisma.resignationRequest.findFirst({
      where: { id: resignationId, companyId },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!resignation) {
      throw new NotFoundException('Resignation request not found.');
    }

    if (resignation.status !== 'APPROVED') {
      throw new BadRequestException(
        'Only approved resignations can be finalized.',
      );
    }

    const finalExitDate =
      resignation.approvedLastWorkingDay ||
      resignation.requestedLastWorkingDay ||
      new Date();

    const checklist: any = resignation.clearanceChecklist || {};
    const hasReturnedAssets = Boolean(checklist.assets?.completed);

    const [updatedResignation] = await this.prisma.$transaction([
      // 1. Mark resignation request COMPLETED
      this.prisma.resignationRequest.update({
        where: { id: resignationId },
        data: {
          status: 'COMPLETED',
          exitInterviewNotes:
            dto?.exitInterviewNotes || resignation.exitInterviewNotes,
        },
      }),
      // 2. Set employee employmentStatus to RESIGNED
      this.prisma.employee.update({
        where: { id: resignation.employeeId },
        data: {
          employmentStatus: 'RESIGNED',
        },
      }),
      // 3. Upsert legacy EmployeeExit for compatibility with profile pages
      this.prisma.employeeExit.upsert({
        where: { employeeId: resignation.employeeId },
        update: {
          exitDate: finalExitDate,
          reason: 'RESIGNED',
          status: 'APPROVED',
          exitInterviewNotes:
            dto?.exitInterviewNotes ||
            resignation.exitInterviewNotes ||
            resignation.hrComment,
          hasReturnedAssets,
        },
        create: {
          employeeId: resignation.employeeId,
          exitDate: finalExitDate,
          reason: 'RESIGNED',
          status: 'APPROVED',
          exitInterviewNotes:
            dto?.exitInterviewNotes ||
            resignation.exitInterviewNotes ||
            resignation.hrComment,
          hasReturnedAssets,
        },
      }),
    ]);

    // Send parting notification
    await this.notificationService.sendInternalNotification(
      companyId,
      resignation.employeeId,
      'Offboarding Finalized',
      `Your departure formalities and clearance have been finalized. Thank you for your contributions!`,
      'SYSTEM',
    );

    await this.auditService.logAction(
      companyId,
      userId,
      'UPDATE',
      'ResignationRequest',
      resignationId,
      null,
      { action: 'COMPLETED_OFFBOARDING', exitDate: finalExitDate },
    );

    return updatedResignation;
  }

  // 9. Statistics for company dashboard
  async getResignationStats(companyId: string, user: any) {
    const isHrOrAdmin = ['HR_HEAD', 'SUPER_ADMIN', 'OWNER'].includes(user.role);
    const where: any = { companyId };

    if (!isHrOrAdmin && user.role === 'MANAGER') {
      where.employee = { reportingManagerId: user.sub };
    }

    const [pending, underReview, noticePeriod, completed, total] =
      await Promise.all([
        this.prisma.resignationRequest.count({
          where: { ...where, status: 'PENDING' },
        }),
        this.prisma.resignationRequest.count({
          where: { ...where, status: 'UNDER_REVIEW' },
        }),
        this.prisma.resignationRequest.count({
          where: { ...where, status: 'APPROVED' },
        }),
        this.prisma.resignationRequest.count({
          where: { ...where, status: 'COMPLETED' },
        }),
        this.prisma.resignationRequest.count({ where }),
      ]);

    return {
      pendingReview: pending + underReview,
      noticePeriod,
      completed,
      total,
    };
  }
}
