import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { SequenceService } from './sequence.service';
import { CandidateActivityService } from './candidate-activity.service';
import {
  OfferStatus,
  CandidateActivityType,
  ApplicationStatus,
} from '../../../generated/prisma/client';
import { CreateJobOfferDto } from '../dto/create-job-offer.dto';
import { ReviseJobOfferDto } from '../dto/revise-job-offer.dto';
import {
  ReviewJobOfferDto,
  OfferReviewAction,
} from '../dto/review-job-offer.dto';
import {
  RecordOfferResponseDto,
  CandidateOfferResponse,
} from '../dto/record-offer-response.dto';
import { WithdrawOfferDto } from '../dto/withdraw-offer.dto';

@Injectable()
export class JobOfferService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly sequenceService: SequenceService,
    private readonly activityService: CandidateActivityService,
  ) {}

  /**
   * Validate strict mathematical consistency matching Payroll SalaryStructure
   */
  private validateFinancialMath(dto: CreateJobOfferDto) {
    const basic = Number(dto.basicSalary) || 0;
    const hra = Number(dto.hra) || 0;
    const conveyance = Number(dto.conveyanceAllowance) || 0;
    const medical = Number(dto.medicalAllowance) || 0;
    const special = Number(dto.specialAllowance) || 0;
    const other = Number(dto.otherAllowances) || 0;
    const expectedGross = basic + hra + conveyance + medical + special + other;

    if (Math.abs(Number(dto.grossMonthly) - expectedGross) > 1.0) {
      throw new BadRequestException(
        `grossMonthly mismatch. Sum of earnings is ${expectedGross.toFixed(2)}, received ${dto.grossMonthly}`,
      );
    }

    const pf = Number(dto.pfContribution) || 0;
    const tax = Number(dto.taxDeduction) || 0;
    const profTax = Number(dto.professionalTax) || 0;
    const expectedNet = expectedGross - (pf + tax + profTax);

    if (Math.abs(Number(dto.netMonthly) - expectedNet) > 1.0) {
      throw new BadRequestException(
        `netMonthly mismatch. Expected gross (${expectedGross.toFixed(2)}) minus deductions (${(pf + tax + profTax).toFixed(2)}) = ${expectedNet.toFixed(2)}, received ${dto.netMonthly}`,
      );
    }

    const expectedAnnualBase = basic * 12;
    if (Math.abs(Number(dto.annualBaseSalary) - expectedAnnualBase) > 1.0) {
      throw new BadRequestException(
        `annualBaseSalary mismatch. Expected basicSalary * 12 = ${expectedAnnualBase.toFixed(2)}, received ${dto.annualBaseSalary}`,
      );
    }

    const expectedAnnualGross = expectedGross * 12;
    if (Math.abs(Number(dto.annualGross) - expectedAnnualGross) > 1.0) {
      throw new BadRequestException(
        `annualGross mismatch. Expected grossMonthly * 12 = ${expectedAnnualGross.toFixed(2)}, received ${dto.annualGross}`,
      );
    }

    const perfBonus = Number(dto.annualPerformanceBonus) || 0;
    const joinBonus = Number(dto.joiningBonus) || 0;
    const expectedCtc = expectedAnnualGross + perfBonus + joinBonus;

    if (Math.abs(Number(dto.totalCtc) - expectedCtc) > 1.0) {
      throw new BadRequestException(
        `totalCtc mismatch. Expected annualGross (${expectedAnnualGross.toFixed(2)}) + bonuses (${(perfBonus + joinBonus).toFixed(2)}) = ${expectedCtc.toFixed(2)}, received ${dto.totalCtc}`,
      );
    }
  }

  /**
   * Create initial job offer draft (Version 1)
   */
  async createOffer(
    applicationId: string,
    companyId: string,
    userId: string,
    dto: CreateJobOfferDto,
  ) {
    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, companyId },
      include: {
        candidate: true,
        jobRequisition: true,
        jobOffer: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Candidate application not found');
    }

    if (application.jobOffer) {
      throw new BadRequestException(
        'A job offer already exists for this application. Use the revise endpoint to create a new version.',
      );
    }

    // Candidate should be in SELECTED or OFFER state
    if (
      application.status !== ApplicationStatus.SELECTED &&
      application.status !== ApplicationStatus.OFFER
    ) {
      throw new BadRequestException(
        `Offers can only be generated for candidates in SELECTED status. Current status: ${application.status}`,
      );
    }

    this.validateFinancialMath(dto);

    // Budget Exception check
    let isBudgetException = false;
    const salaryMax = application.jobRequisition.salaryMax
      ? Number(application.jobRequisition.salaryMax)
      : null;

    if (salaryMax && dto.totalCtc > salaryMax) {
      if (!dto.budgetJustification?.trim()) {
        throw new BadRequestException(
          `Proposed total CTC (₹${dto.totalCtc.toLocaleString()}) exceeds the approved requisition budget maximum of ₹${salaryMax.toLocaleString()}. A budget justification is required for exception approval.`,
        );
      }
      isBudgetException = true;
    }

    const offerCode = await this.sequenceService.getNextSequence(
      companyId,
      'JOB_OFFER',
      'OFFER',
    );

    const offer = await this.prisma.jobOffer.create({
      data: {
        companyId,
        applicationId,
        candidateId: application.candidateId,
        jobRequisitionId: application.jobRequisitionId,
        offerCode,
        currentVersion: 1,
        status: OfferStatus.DRAFT,
        createdById: userId,
        versions: {
          create: {
            version: 1,
            status: OfferStatus.DRAFT,
            basicSalary: dto.basicSalary,
            hra: dto.hra || 0,
            conveyanceAllowance: dto.conveyanceAllowance || 0,
            medicalAllowance: dto.medicalAllowance || 0,
            specialAllowance: dto.specialAllowance || 0,
            otherAllowances: dto.otherAllowances || 0,
            grossMonthly: dto.grossMonthly,
            pfContribution: dto.pfContribution || 0,
            taxDeduction: dto.taxDeduction || 0,
            professionalTax: dto.professionalTax || 0,
            netMonthly: dto.netMonthly,
            annualBaseSalary: dto.annualBaseSalary,
            annualGross: dto.annualGross,
            annualPerformanceBonus: dto.annualPerformanceBonus || 0,
            joiningBonus: dto.joiningBonus || 0,
            totalCtc: dto.totalCtc,
            isBudgetException,
            budgetJustification: dto.budgetJustification,
            departmentId:
              dto.departmentId || application.jobRequisition.departmentId,
            designationId:
              dto.designationId || application.jobRequisition.designationId,
            joiningDate: new Date(dto.joiningDate),
            expiryDate: new Date(dto.expiryDate),
            probationDurationMonths: dto.probationDurationMonths || 3,
            noticePeriodDays: dto.noticePeriodDays || 30,
            reportingManagerId: dto.reportingManagerId,
            workplaceType: dto.workplaceType,
            termsAndConditions: dto.termsAndConditions,
          },
        },
      },
      include: {
        versions: {
          orderBy: { version: 'desc' },
        },
      },
    });

    await this.activityService.logActivity({
      companyId,
      applicationId,
      type: CandidateActivityType.OFFER_CREATED,
      title: `Job Offer ${offerCode} (v1) created`,
      description: `Draft compensation offer formulated with Annual CTC of ₹${dto.totalCtc.toLocaleString()}.${
        isBudgetException ? ' Flagged for budget exception review.' : ''
      }`,
      performedById: userId,
      metadata: {
        offerCode,
        version: 1,
        totalCtc: dto.totalCtc,
        isBudgetException,
      },
    });

    await this.auditService.logAction(
      companyId,
      userId,
      'CREATE',
      'JOB_OFFER',
      offer.id,
      undefined,
      { offerCode, version: 1, totalCtc: dto.totalCtc },
    );

    return offer;
  }

  /**
   * Revise an existing offer by creating a new version snapshot (v2, v3...)
   */
  async reviseOffer(
    offerId: string,
    companyId: string,
    userId: string,
    dto: ReviseJobOfferDto,
  ) {
    const offer = await this.prisma.jobOffer.findFirst({
      where: { id: offerId, companyId },
      include: {
        jobRequisition: true,
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (!offer) {
      throw new NotFoundException('Job offer not found');
    }

    if (offer.status === OfferStatus.ACCEPTED) {
      throw new BadRequestException(
        'Cannot revise an offer that has already been accepted.',
      );
    }

    this.validateFinancialMath(dto);

    let isBudgetException = false;
    const salaryMax = offer.jobRequisition.salaryMax
      ? Number(offer.jobRequisition.salaryMax)
      : null;

    if (salaryMax && dto.totalCtc > salaryMax) {
      if (!dto.budgetJustification?.trim()) {
        throw new BadRequestException(
          `Proposed total CTC (₹${dto.totalCtc.toLocaleString()}) exceeds the approved requisition budget maximum of ₹${salaryMax.toLocaleString()}. A budget justification is required for exception approval.`,
        );
      }
      isBudgetException = true;
    }

    const nextVersion = offer.currentVersion + 1;

    const updated = await this.prisma.jobOffer.update({
      where: { id: offerId },
      data: {
        currentVersion: nextVersion,
        status: OfferStatus.DRAFT,
        approvedById: null,
        approvedAt: null,
        sentAt: null,
        respondedAt: null,
        declineReason: null,
        versions: {
          create: {
            version: nextVersion,
            status: OfferStatus.DRAFT,
            revisionReason: dto.revisionReason,
            basicSalary: dto.basicSalary,
            hra: dto.hra || 0,
            conveyanceAllowance: dto.conveyanceAllowance || 0,
            medicalAllowance: dto.medicalAllowance || 0,
            specialAllowance: dto.specialAllowance || 0,
            otherAllowances: dto.otherAllowances || 0,
            grossMonthly: dto.grossMonthly,
            pfContribution: dto.pfContribution || 0,
            taxDeduction: dto.taxDeduction || 0,
            professionalTax: dto.professionalTax || 0,
            netMonthly: dto.netMonthly,
            annualBaseSalary: dto.annualBaseSalary,
            annualGross: dto.annualGross,
            annualPerformanceBonus: dto.annualPerformanceBonus || 0,
            joiningBonus: dto.joiningBonus || 0,
            totalCtc: dto.totalCtc,
            isBudgetException,
            budgetJustification: dto.budgetJustification,
            departmentId: dto.departmentId || offer.jobRequisition.departmentId,
            designationId:
              dto.designationId || offer.jobRequisition.designationId,
            joiningDate: new Date(dto.joiningDate),
            expiryDate: new Date(dto.expiryDate),
            probationDurationMonths: dto.probationDurationMonths || 3,
            noticePeriodDays: dto.noticePeriodDays || 30,
            reportingManagerId: dto.reportingManagerId,
            workplaceType: dto.workplaceType,
            termsAndConditions: dto.termsAndConditions,
          },
        },
      },
      include: {
        versions: {
          orderBy: { version: 'desc' },
        },
      },
    });

    await this.activityService.logActivity({
      companyId,
      applicationId: offer.applicationId,
      type: CandidateActivityType.OFFER_REVISED,
      title: `Job Offer ${offer.offerCode} revised to version ${nextVersion}`,
      description: `Revision: ${dto.revisionReason}. New Annual CTC: ₹${dto.totalCtc.toLocaleString()}`,
      performedById: userId,
      metadata: {
        offerCode: offer.offerCode,
        version: nextVersion,
        totalCtc: dto.totalCtc,
        revisionReason: dto.revisionReason,
      },
    });

    await this.auditService.logAction(
      companyId,
      userId,
      'UPDATE',
      'JOB_OFFER',
      offerId,
      { version: offer.currentVersion },
      { version: nextVersion, totalCtc: dto.totalCtc },
    );

    return updated;
  }

  /**
   * Submit current version of offer for internal management / HR Head approval
   */
  async submitForApproval(offerId: string, companyId: string, userId: string) {
    const offer = await this.prisma.jobOffer.findFirst({
      where: { id: offerId, companyId },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (!offer) {
      throw new NotFoundException('Job offer not found');
    }

    if (
      offer.status !== OfferStatus.DRAFT &&
      offer.status !== OfferStatus.REJECTED
    ) {
      throw new BadRequestException(
        `Only DRAFT or REJECTED offers can be submitted for approval. Current status: ${offer.status}`,
      );
    }

    const currentVersionRecord = offer.versions[0];
    if (!currentVersionRecord) {
      throw new BadRequestException('No version record found for offer.');
    }

    const [updatedOffer] = await this.prisma.$transaction([
      this.prisma.jobOffer.update({
        where: { id: offerId },
        data: { status: OfferStatus.PENDING_APPROVAL },
      }),
      this.prisma.jobOfferVersion.update({
        where: { id: currentVersionRecord.id },
        data: { status: OfferStatus.PENDING_APPROVAL },
      }),
    ]);

    await this.activityService.logActivity({
      companyId,
      applicationId: offer.applicationId,
      type: CandidateActivityType.OFFER_SUBMITTED_FOR_APPROVAL,
      title: `Job Offer ${offer.offerCode} (v${offer.currentVersion}) submitted for approval`,
      description: `Submitted for internal compensation review with Annual CTC ₹${currentVersionRecord.totalCtc.toLocaleString()}`,
      performedById: userId,
      metadata: { offerCode: offer.offerCode, version: offer.currentVersion },
    });

    return updatedOffer;
  }

  /**
   * Review offer (Approve or Reject). Role-gated to HR Head / Super Admin / Owner.
   */
  async reviewOffer(
    offerId: string,
    companyId: string,
    reviewerId: string,
    dto: ReviewJobOfferDto,
  ) {
    const offer = await this.prisma.jobOffer.findFirst({
      where: { id: offerId, companyId },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (!offer) {
      throw new NotFoundException('Job offer not found');
    }

    if (offer.status !== OfferStatus.PENDING_APPROVAL) {
      throw new BadRequestException(
        `Only offers in PENDING_APPROVAL status can be reviewed. Current status: ${offer.status}`,
      );
    }

    const currentVersionRecord = offer.versions[0];
    const isApproved = dto.action === OfferReviewAction.APPROVE;
    const newStatus = isApproved ? OfferStatus.APPROVED : OfferStatus.REJECTED;

    const [updatedOffer] = await this.prisma.$transaction([
      this.prisma.jobOffer.update({
        where: { id: offerId },
        data: {
          status: newStatus,
          approvedById: isApproved ? reviewerId : null,
          approvedAt: isApproved ? new Date() : null,
        },
      }),
      this.prisma.jobOfferVersion.update({
        where: { id: currentVersionRecord.id },
        data: {
          status: newStatus,
          reviewedById: reviewerId,
          reviewedAt: new Date(),
          reviewNotes: dto.comments || null,
        },
      }),
    ]);

    await this.activityService.logActivity({
      companyId,
      applicationId: offer.applicationId,
      type: isApproved
        ? CandidateActivityType.OFFER_APPROVED
        : CandidateActivityType.OFFER_REJECTED,
      title: `Job Offer ${offer.offerCode} (v${offer.currentVersion}) ${
        isApproved ? 'approved' : 'rejected'
      }`,
      description: dto.comments
        ? `Review notes: ${dto.comments}`
        : isApproved
          ? 'Offer compensation package approved.'
          : 'Offer draft rejected. Please revise compensation.',
      performedById: reviewerId,
      metadata: {
        offerCode: offer.offerCode,
        version: offer.currentVersion,
        action: dto.action,
        comments: dto.comments,
      },
    });

    await this.auditService.logAction(
      companyId,
      reviewerId,
      isApproved ? 'APPROVE' : 'REJECT',
      'JOB_OFFER',
      offerId,
      { status: OfferStatus.PENDING_APPROVAL },
      { status: newStatus, comments: dto.comments },
    );

    return updatedOffer;
  }

  /**
   * Send approved offer to candidate. Transitions application to OFFER stage.
   */
  async sendOffer(offerId: string, companyId: string, userId: string) {
    const offer = await this.prisma.jobOffer.findFirst({
      where: { id: offerId, companyId },
      include: {
        application: true,
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (!offer) {
      throw new NotFoundException('Job offer not found');
    }

    if (offer.status !== OfferStatus.APPROVED) {
      throw new BadRequestException(
        `Only internally APPROVED offers can be sent to the candidate. Current status: ${offer.status}`,
      );
    }

    const currentVersionRecord = offer.versions[0];
    const sentAt = new Date();

    const [updatedOffer] = await this.prisma.$transaction([
      this.prisma.jobOffer.update({
        where: { id: offerId },
        data: {
          status: OfferStatus.SENT,
          sentAt,
        },
      }),
      this.prisma.jobOfferVersion.update({
        where: { id: currentVersionRecord.id },
        data: { status: OfferStatus.SENT },
      }),
      this.prisma.application.update({
        where: { id: offer.applicationId },
        data: { status: ApplicationStatus.OFFER },
      }),
    ]);

    await this.activityService.logActivity({
      companyId,
      applicationId: offer.applicationId,
      type: CandidateActivityType.OFFER_SENT,
      title: `Job Offer ${offer.offerCode} sent to candidate`,
      description: `Formal offer letter (v${offer.currentVersion}) with Annual CTC ₹${currentVersionRecord.totalCtc.toLocaleString()} transmitted to candidate. Expiry date: ${new Date(
        currentVersionRecord.expiryDate,
      ).toLocaleDateString()}`,
      performedById: userId,
      metadata: {
        offerCode: offer.offerCode,
        version: offer.currentVersion,
        sentAt,
        expiryDate: currentVersionRecord.expiryDate,
      },
    });

    await this.auditService.logAction(
      companyId,
      userId,
      'UPDATE',
      'JOB_OFFER',
      offerId,
      { status: OfferStatus.APPROVED },
      { status: OfferStatus.SENT },
    );

    return updatedOffer;
  }

  /**
   * Record candidate response (ACCEPTED or DECLINED).
   * ACCEPTED updates application status to OFFER_ACCEPTED. (Requisition filledCount is updated upon candidate conversion/hire).
   */
  async recordCandidateResponse(
    offerId: string,
    companyId: string,
    userId: string,
    dto: RecordOfferResponseDto,
  ) {
    const offer = await this.prisma.jobOffer.findFirst({
      where: { id: offerId, companyId },
      include: {
        application: true,
        jobRequisition: true,
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (!offer) {
      throw new NotFoundException('Job offer not found');
    }

    if (offer.status !== OfferStatus.SENT) {
      throw new BadRequestException(
        `Candidate responses can only be recorded for SENT offers. Current status: ${offer.status}`,
      );
    }

    const currentVersionRecord = offer.versions[0];
    const isAccepted = dto.response === CandidateOfferResponse.ACCEPTED;

    if (
      isAccepted &&
      currentVersionRecord.expiryDate &&
      new Date() > new Date(currentVersionRecord.expiryDate)
    ) {
      throw new BadRequestException(
        'This job offer has expired and can no longer be accepted. A revised offer must be formulated.',
      );
    }

    const newStatus = isAccepted ? OfferStatus.ACCEPTED : OfferStatus.DECLINED;
    const respondedAt = new Date();

    const transactions: any[] = [
      this.prisma.jobOffer.update({
        where: { id: offerId },
        data: {
          status: newStatus,
          respondedAt,
          declineReason: !isAccepted ? dto.declineReason || null : null,
        },
      }),
      this.prisma.jobOfferVersion.update({
        where: { id: currentVersionRecord.id },
        data: { status: newStatus },
      }),
    ];

    if (isAccepted) {
      transactions.push(
        this.prisma.application.update({
          where: { id: offer.applicationId },
          data: { status: ApplicationStatus.OFFER_ACCEPTED },
        }),
      );
    }

    const [updatedOffer] = await this.prisma.$transaction(transactions);

    await this.activityService.logActivity({
      companyId,
      applicationId: offer.applicationId,
      type: isAccepted
        ? CandidateActivityType.OFFER_ACCEPTED
        : CandidateActivityType.OFFER_DECLINED,
      title: isAccepted
        ? `Job Offer accepted by candidate! 🎉`
        : `Job Offer declined by candidate`,
      description: isAccepted
        ? `Candidate accepted Job Offer ${offer.offerCode} (v${offer.currentVersion}). Application transitioned to OFFER_ACCEPTED.`
        : `Candidate declined Job Offer ${offer.offerCode}. Reason: ${dto.declineReason || 'Not specified'}`,
      performedById: userId,
      metadata: {
        offerCode: offer.offerCode,
        version: offer.currentVersion,
        response: dto.response,
        declineReason: dto.declineReason,
      },
    });

    await this.auditService.logAction(
      companyId,
      userId,
      'UPDATE',
      'JOB_OFFER',
      offerId,
      { status: OfferStatus.SENT },
      { status: newStatus, declineReason: dto.declineReason },
    );

    return updatedOffer;
  }

  /**
   * Rescind / Withdraw an offer with justification
   */
  async withdrawOffer(
    offerId: string,
    companyId: string,
    userId: string,
    dto: WithdrawOfferDto,
  ) {
    const offer = await this.prisma.jobOffer.findFirst({
      where: { id: offerId, companyId },
      include: {
        application: true,
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (!offer) {
      throw new NotFoundException('Job offer not found');
    }

    if (
      offer.status !== OfferStatus.APPROVED &&
      offer.status !== OfferStatus.SENT
    ) {
      throw new BadRequestException(
        `Only APPROVED or SENT offers can be withdrawn. Current status: ${offer.status}`,
      );
    }

    const currentVersionRecord = offer.versions[0];

    const transactions: any[] = [
      this.prisma.jobOffer.update({
        where: { id: offerId },
        data: {
          status: OfferStatus.WITHDRAWN,
          withdrawalReason: dto.reason,
        },
      }),
      this.prisma.jobOfferVersion.update({
        where: { id: currentVersionRecord.id },
        data: { status: OfferStatus.WITHDRAWN },
      }),
    ];

    // If application was in OFFER stage, rollback to SELECTED
    if (offer.application.status === ApplicationStatus.OFFER) {
      transactions.push(
        this.prisma.application.update({
          where: { id: offer.applicationId },
          data: { status: ApplicationStatus.SELECTED },
        }),
      );
    }

    const [updatedOffer] = await this.prisma.$transaction(transactions);

    await this.activityService.logActivity({
      companyId,
      applicationId: offer.applicationId,
      type: CandidateActivityType.OFFER_WITHDRAWN,
      title: `Job Offer ${offer.offerCode} withdrawn`,
      description: `Offer rescinded by company. Reason: ${dto.reason}`,
      performedById: userId,
      metadata: { offerCode: offer.offerCode, reason: dto.reason },
    });

    return updatedOffer;
  }

  /**
   * Automatic lazy or scheduled check to transition expired offers
   */
  private async checkAndExpireSingleOffer(offer: any) {
    if (offer.status === OfferStatus.SENT && offer.versions?.[0]?.expiryDate) {
      const expiry = new Date(offer.versions[0].expiryDate);
      if (expiry < new Date()) {
        await this.prisma.$transaction([
          this.prisma.jobOffer.update({
            where: { id: offer.id },
            data: { status: OfferStatus.EXPIRED },
          }),
          this.prisma.jobOfferVersion.update({
            where: { id: offer.versions[0].id },
            data: { status: OfferStatus.EXPIRED },
          }),
        ]);

        await this.activityService.logActivity({
          companyId: offer.companyId,
          applicationId: offer.applicationId,
          type: CandidateActivityType.OFFER_EXPIRED,
          title: `Job Offer ${offer.offerCode} expired`,
          description: `The offer reached its deadline (${expiry.toLocaleDateString()}) without candidate response.`,
          metadata: { offerCode: offer.offerCode, expiryDate: expiry },
        });

        offer.status = OfferStatus.EXPIRED;
        if (offer.versions?.[0]) {
          offer.versions[0].status = OfferStatus.EXPIRED;
        }
      }
    }
  }

  /**
   * Retrieve active job offer with full historical versions and snapshots
   */
  async getOfferByApplication(applicationId: string, companyId: string) {
    const offer = await this.prisma.jobOffer.findFirst({
      where: { applicationId, companyId },
      include: {
        application: {
          include: {
            candidate: true,
            jobRequisition: {
              include: {
                department: true,
                designation: true,
              },
            },
          },
        },
        candidate: true,
        jobRequisition: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        versions: {
          orderBy: { version: 'desc' },
          include: {
            department: true,
            designation: true,
            reportingManager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            reviewedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (offer) {
      await this.checkAndExpireSingleOffer(offer);
    }

    return offer;
  }
}
