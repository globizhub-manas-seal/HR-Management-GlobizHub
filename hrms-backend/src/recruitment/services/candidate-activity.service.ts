import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CandidateActivityType } from '../../../generated/prisma/client';
import { CandidateDecisionDto } from '../dto/candidate-decision.dto';

@Injectable()
export class CandidateActivityService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * Log an immutable candidate activity event
   */
  async logActivity(params: {
    companyId: string;
    applicationId: string;
    type: CandidateActivityType;
    title: string;
    description?: string;
    performedById?: string;
    metadata?: any;
  }) {
    return this.prisma.candidateActivity.create({
      data: {
        companyId: params.companyId,
        applicationId: params.applicationId,
        type: params.type,
        title: params.title,
        description: params.description,
        performedById: params.performedById,
        metadata: params.metadata ?? {},
      },
    });
  }

  /**
   * Fetch the complete, chronological activity trail for a candidate application
   */
  async getTimeline(applicationId: string, companyId: string) {
    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, companyId },
      include: {
        candidate: true,
        jobRequisition: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Candidate application not found');
    }

    const activities = await this.prisma.candidateActivity.findMany({
      where: { applicationId, companyId },
      include: {
        performedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            profilePhoto: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      applicationId: application.id,
      applicationNumber: application.applicationNumber,
      candidate: {
        id: application.candidate.id,
        firstName: application.candidate.firstName,
        lastName: application.candidate.lastName,
        email: application.candidate.email,
      },
      job: {
        id: application.jobRequisition.id,
        title: application.jobRequisition.title,
        jobCode: application.jobRequisition.jobCode,
      },
      currentStatus: application.status,
      activities,
    };
  }

  /**
   * Make explicit human hiring decision on candidate (SELECTED or REJECTED)
   */
  async makeCandidateDecision(
    applicationId: string,
    companyId: string,
    reviewerId: string,
    dto: CandidateDecisionDto,
  ) {
    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, companyId },
      include: {
        candidate: true,
        jobRequisition: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Candidate application not found');
    }

    if (
      application.status !== 'INTERVIEW' &&
      application.status !== 'SHORTLISTED'
    ) {
      throw new BadRequestException(
        `Final candidate decision can only be made from INTERVIEW stage (current status: ${application.status})`,
      );
    }

    const updatedApplication = await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        status: dto.decision,
      },
      include: {
        candidate: true,
        jobRequisition: true,
      },
    });

    // Log in CandidateActivity
    const activityType =
      dto.decision === 'SELECTED'
        ? CandidateActivityType.CANDIDATE_SELECTED
        : CandidateActivityType.CANDIDATE_REJECTED;

    const title =
      dto.decision === 'SELECTED'
        ? `Candidate marked as SELECTED for ${application.jobRequisition.title}`
        : `Candidate marked as REJECTED for ${application.jobRequisition.title}`;

    await this.logActivity({
      companyId,
      applicationId,
      type: activityType,
      title,
      description:
        dto.notes ||
        (dto.decision === 'SELECTED'
          ? 'Candidate successfully cleared interview process and is selected for offer extension.'
          : 'Candidate was not selected following interview evaluation.'),
      performedById: reviewerId,
      metadata: {
        decision: dto.decision,
        notes: dto.notes,
        previousStatus: application.status,
      },
    });

    await this.auditService.logAction(
      companyId,
      reviewerId,
      dto.decision === 'SELECTED' ? 'APPROVE' : 'REJECT',
      'Application',
      applicationId,
      { status: application.status },
      { status: dto.decision, notes: dto.notes },
    );

    return updatedApplication;
  }
}
