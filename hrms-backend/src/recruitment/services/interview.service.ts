import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CandidateActivityService } from './candidate-activity.service';
import {
  ScheduleInterviewDto,
  RescheduleInterviewDto,
  UpdateInterviewStatusDto,
} from '../dto/schedule-interview.dto';
import {
  InterviewStatus,
  CandidateActivityType,
} from '../../../generated/prisma/client';

@Injectable()
export class InterviewService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private candidateActivityService: CandidateActivityService,
  ) {}

  /**
   * Schedule an interview event for a candidate application
   */
  async scheduleInterview(
    applicationId: string,
    companyId: string,
    schedulerId: string,
    dto: ScheduleInterviewDto,
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
      application.status !== 'SHORTLISTED' &&
      application.status !== 'INTERVIEW'
    ) {
      throw new BadRequestException(
        `Interviews can only be scheduled for candidates in SHORTLISTED or INTERVIEW status (current status: ${application.status})`,
      );
    }

    const round = await this.prisma.interviewRound.findFirst({
      where: {
        id: dto.interviewRoundId,
        companyId,
        jobRequisitionId: application.jobRequisitionId,
      },
      include: { criteria: true },
    });

    if (!round) {
      throw new NotFoundException(
        'Interview round not found or does not belong to this job requisition',
      );
    }

    if (!round.isActive) {
      throw new BadRequestException(
        'Cannot schedule interviews for an inactive/archived round',
      );
    }

    if (!dto.interviewers || dto.interviewers.length === 0) {
      throw new BadRequestException(
        'At least one interviewer must be assigned',
      );
    }

    const durationMinutes = dto.durationMinutes ?? round.durationMinutes ?? 60;
    const startTime = new Date(dto.scheduledAt);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

    if (isNaN(startTime.getTime())) {
      throw new BadRequestException('Invalid scheduled date/time provided');
    }

    // --- Schedule Conflict Check ---
    const interviewerEmployeeIds = dto.interviewers.map((i) => i.employeeId);
    await this.checkInterviewerConflicts(
      companyId,
      interviewerEmployeeIds,
      startTime,
      endTime,
    );

    // Create Interview within transaction
    const interview = await this.prisma.$transaction(async (tx) => {
      const newInterview = await tx.interview.create({
        data: {
          companyId,
          applicationId,
          interviewRoundId: dto.interviewRoundId,
          scheduledAt: startTime,
          durationMinutes,
          timezone: dto.timezone || 'Asia/Kolkata',
          mode: dto.mode,
          meetingLink: dto.meetingLink,
          location: dto.location,
          notes: dto.notes,
          status: InterviewStatus.SCHEDULED,
          interviewers: {
            create: dto.interviewers.map((i) => ({
              employeeId: i.employeeId,
              role: i.role || 'PANEL',
            })),
          },
        },
        include: {
          interviewRound: true,
          interviewers: {
            include: {
              employee: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  designation: { select: { name: true } },
                },
              },
            },
          },
        },
      });

      // Advance application from SHORTLISTED to INTERVIEW automatically
      if (application.status === 'SHORTLISTED') {
        await tx.application.update({
          where: { id: applicationId },
          data: { status: 'INTERVIEW' },
        });
      }

      return newInterview;
    });

    // Log Activity
    const interviewerNames = interview.interviewers
      .map((i) => `${i.employee.firstName} ${i.employee.lastName}`)
      .join(', ');

    await this.candidateActivityService.logActivity({
      companyId,
      applicationId,
      type: CandidateActivityType.INTERVIEW_SCHEDULED,
      title: `${round.name} scheduled`,
      description: `Scheduled for ${startTime.toLocaleString('en-US', {
        timeZone: interview.timezone,
        dateStyle: 'medium',
        timeStyle: 'short',
      })} (${interview.mode}) with ${interviewerNames}`,
      performedById: schedulerId,
      metadata: {
        interviewId: interview.id,
        roundId: round.id,
        roundName: round.name,
        mode: interview.mode,
        scheduledAt: interview.scheduledAt,
        durationMinutes: interview.durationMinutes,
      },
    });

    await this.auditService.logAction(
      companyId,
      schedulerId,
      'CREATE',
      'Interview',
      interview.id,
      null,
      {
        candidateName: `${application.candidate.firstName} ${application.candidate.lastName}`,
        roundName: round.name,
        scheduledAt: interview.scheduledAt,
      },
    );

    return interview;
  }

  /**
   * Get all interviews for an application
   */
  async getInterviewsForApplication(applicationId: string, companyId: string) {
    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, companyId },
    });

    if (!application) {
      throw new NotFoundException('Candidate application not found');
    }

    return this.prisma.interview.findMany({
      where: { applicationId, companyId },
      include: {
        interviewRound: {
          include: {
            criteria: {
              orderBy: { sequence: 'asc' },
            },
          },
        },
        interviewers: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profilePhoto: true,
                designation: { select: { name: true } },
              },
            },
          },
        },
        scorecards: {
          select: {
            id: true,
            interviewerId: true,
            overallRating: true,
            recommendation: true,
            isSubmitted: true,
            submittedAt: true,
            sharedFeedback: true,
            interviewer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  /**
   * Get interview details by ID
   */
  async getInterviewById(interviewId: string, companyId: string) {
    const interview = await this.prisma.interview.findFirst({
      where: { id: interviewId, companyId },
      include: {
        interviewRound: {
          include: {
            criteria: {
              orderBy: { sequence: 'asc' },
            },
          },
        },
        application: {
          include: {
            candidate: true,
            jobRequisition: true,
          },
        },
        interviewers: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profilePhoto: true,
                designation: { select: { name: true } },
              },
            },
          },
        },
        scorecards: {
          include: {
            interviewer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            evaluations: {
              include: { criterion: true },
            },
          },
        },
      },
    });

    if (!interview) {
      throw new NotFoundException('Interview not found');
    }

    return interview;
  }

  /**
   * Reschedule an interview with conflict checking
   */
  async rescheduleInterview(
    interviewId: string,
    companyId: string,
    userId: string,
    dto: RescheduleInterviewDto,
  ) {
    const interview = await this.prisma.interview.findFirst({
      where: { id: interviewId, companyId },
      include: {
        interviewRound: true,
        interviewers: { select: { employeeId: true } },
        application: true,
      },
    });

    if (!interview) {
      throw new NotFoundException('Interview not found');
    }

    const durationMinutes = dto.durationMinutes ?? interview.durationMinutes;
    const newStartTime = new Date(dto.scheduledAt);
    const newEndTime = new Date(
      newStartTime.getTime() + durationMinutes * 60000,
    );

    const interviewerIds = interview.interviewers.map((i) => i.employeeId);
    await this.checkInterviewerConflicts(
      companyId,
      interviewerIds,
      newStartTime,
      newEndTime,
      interviewId,
    );

    const updated = await this.prisma.interview.update({
      where: { id: interviewId },
      data: {
        scheduledAt: newStartTime,
        durationMinutes,
        status: InterviewStatus.RESCHEDULED,
        meetingLink: dto.meetingLink ?? interview.meetingLink,
        location: dto.location ?? interview.location,
        notes: dto.reason
          ? `Rescheduled: ${dto.reason}\n${interview.notes || ''}`
          : interview.notes,
      },
      include: {
        interviewRound: true,
        interviewers: {
          include: {
            employee: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    await this.candidateActivityService.logActivity({
      companyId,
      applicationId: interview.applicationId,
      type: CandidateActivityType.INTERVIEW_RESCHEDULED,
      title: `${interview.interviewRound.name} rescheduled`,
      description: `New time: ${newStartTime.toLocaleString('en-US', {
        timeZone: interview.timezone,
        dateStyle: 'medium',
        timeStyle: 'short',
      })}.${dto.reason ? ` Reason: ${dto.reason}` : ''}`,
      performedById: userId,
      metadata: {
        interviewId,
        newScheduledAt: newStartTime,
        reason: dto.reason,
      },
    });

    return updated;
  }

  /**
   * Cancel an interview
   */
  async cancelInterview(
    interviewId: string,
    companyId: string,
    userId: string,
    reason?: string,
  ) {
    const interview = await this.prisma.interview.findFirst({
      where: { id: interviewId, companyId },
      include: { interviewRound: true },
    });

    if (!interview) {
      throw new NotFoundException('Interview not found');
    }

    const updated = await this.prisma.interview.update({
      where: { id: interviewId },
      data: {
        status: InterviewStatus.CANCELLED,
        notes: reason
          ? `Cancelled: ${reason}\n${interview.notes || ''}`
          : interview.notes,
      },
    });

    await this.candidateActivityService.logActivity({
      companyId,
      applicationId: interview.applicationId,
      type: CandidateActivityType.INTERVIEW_CANCELLED,
      title: `${interview.interviewRound.name} cancelled`,
      description: reason
        ? `Reason: ${reason}`
        : 'Interview was cancelled by recruiter.',
      performedById: userId,
      metadata: {
        interviewId,
        reason,
      },
    });

    return updated;
  }

  /**
   * Update interview status (CONFIRMED, IN_PROGRESS, COMPLETED, NO_SHOW)
   */
  async updateInterviewStatus(
    interviewId: string,
    companyId: string,
    userId: string,
    dto: UpdateInterviewStatusDto,
  ) {
    const interview = await this.prisma.interview.findFirst({
      where: { id: interviewId, companyId },
      include: { interviewRound: true },
    });

    if (!interview) {
      throw new NotFoundException('Interview not found');
    }

    const updated = await this.prisma.interview.update({
      where: { id: interviewId },
      data: {
        status: dto.status,
        notes: dto.notes
          ? `${dto.notes}\n${interview.notes || ''}`
          : interview.notes,
      },
    });

    if (dto.status === InterviewStatus.COMPLETED) {
      await this.candidateActivityService.logActivity({
        companyId,
        applicationId: interview.applicationId,
        type: CandidateActivityType.INTERVIEW_COMPLETED,
        title: `${interview.interviewRound.name} marked as completed`,
        description: dto.notes || 'Interview session has concluded.',
        performedById: userId,
        metadata: {
          interviewId,
          status: dto.status,
        },
      });
    }

    return updated;
  }

  /**
   * Helper: Check if any of the assigned interviewers has a schedule conflict
   */
  private async checkInterviewerConflicts(
    companyId: string,
    interviewerIds: string[],
    newStart: Date,
    newEnd: Date,
    excludeInterviewId?: string,
  ) {
    // Find all active interviews on same day / overlapping period involving any of the interviewers
    const candidateInterviews = await this.prisma.interview.findMany({
      where: {
        companyId,
        id: excludeInterviewId ? { not: excludeInterviewId } : undefined,
        status: {
          in: [
            InterviewStatus.SCHEDULED,
            InterviewStatus.CONFIRMED,
            InterviewStatus.IN_PROGRESS,
          ],
        },
        interviewers: {
          some: {
            employeeId: { in: interviewerIds },
          },
        },
      },
      include: {
        interviewRound: { select: { name: true } },
        interviewers: {
          include: {
            employee: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    for (const existing of candidateInterviews) {
      const existingStart = new Date(existing.scheduledAt);
      const existingEnd = new Date(
        existingStart.getTime() + existing.durationMinutes * 60000,
      );

      // Overlap check: (StartA < EndB) && (EndA > StartB)
      if (newStart < existingEnd && newEnd > existingStart) {
        // Find which interviewer has the conflict
        const overlappingEmployees = existing.interviewers.filter((i) =>
          interviewerIds.includes(i.employeeId),
        );

        const conflictNames = overlappingEmployees
          .map((i) => `${i.employee.firstName} ${i.employee.lastName}`)
          .join(', ');

        const timeStr = `${existingStart.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })} - ${existingEnd.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}`;

        throw new ConflictException(
          `Schedule Conflict: ${conflictNames} already has an active interview (${existing.interviewRound.name}) scheduled from ${timeStr}. Please select a different time slot or reassign interviewers.`,
        );
      }
    }
  }
}
