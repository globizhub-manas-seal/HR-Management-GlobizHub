import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CandidateActivityService } from './candidate-activity.service';
import { SubmitScorecardDto } from '../dto/submit-scorecard.dto';
import {
  CandidateActivityType,
  InterviewerRole,
} from '../../../generated/prisma/client';

@Injectable()
export class ScorecardService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private candidateActivityService: CandidateActivityService,
  ) {}

  /**
   * Get all scorecards for an interview, honoring privacy rules (private notes)
   */
  async getScorecardsForInterview(
    interviewId: string,
    companyId: string,
    userEmployeeId: string,
    isRecruiterOrAdmin: boolean,
  ) {
    const interview = await this.prisma.interview.findFirst({
      where: { id: interviewId, companyId },
      include: {
        interviewRound: {
          include: {
            criteria: { orderBy: { sequence: 'asc' } },
          },
        },
      },
    });

    if (!interview) {
      throw new NotFoundException('Interview not found');
    }

    const scorecards = await this.prisma.interviewScorecard.findMany({
      where: { interviewId, companyId },
      include: {
        interviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePhoto: true,
            designation: { select: { name: true } },
          },
        },
        evaluations: {
          include: {
            criterion: true,
          },
          orderBy: { criterion: { sequence: 'asc' } },
        },
      },
    });

    // Strip private notes if user is not Recruiter/Admin and not the author
    return scorecards.map((sc) => {
      const isAuthor = sc.interviewerId === userEmployeeId;
      if (!isRecruiterOrAdmin && !isAuthor) {
        return {
          ...sc,
          privateNotes: undefined, // Hidden from other interviewers
        };
      }
      return sc;
    });
  }

  /**
   * Submit or update a structured interview scorecard
   */
  async submitScorecard(
    interviewId: string,
    interviewerEmployeeId: string,
    companyId: string,
    dto: SubmitScorecardDto,
  ) {
    const interview = await this.prisma.interview.findFirst({
      where: { id: interviewId, companyId },
      include: {
        interviewRound: {
          include: { criteria: true },
        },
        interviewers: true,
        application: {
          include: { candidate: true },
        },
      },
    });

    if (!interview) {
      throw new NotFoundException('Interview not found');
    }

    // Role check: interviewer must be assigned
    const assignment = interview.interviewers.find(
      (i) => i.employeeId === interviewerEmployeeId,
    );

    if (!assignment) {
      throw new ForbiddenException(
        'You are not assigned as an interviewer for this interview session',
      );
    }

    if (assignment.role === InterviewerRole.OBSERVER) {
      throw new ForbiddenException(
        'Observers are not permitted to submit interview scorecards',
      );
    }

    // Calculate overall rating if not explicitly provided
    let calculatedRating = dto.overallRating;
    if (calculatedRating === undefined || calculatedRating === null) {
      if (dto.evaluations && dto.evaluations.length > 0) {
        const sum = dto.evaluations.reduce(
          (acc, e) => acc + Number(e.rating),
          0,
        );
        calculatedRating = Number((sum / dto.evaluations.length).toFixed(1));
      } else {
        calculatedRating = 3.0;
      }
    }

    const scorecard = await this.prisma.$transaction(async (tx) => {
      // 1. Upsert InterviewScorecard
      const upserted = await tx.interviewScorecard.upsert({
        where: {
          interviewId_interviewerId: {
            interviewId,
            interviewerId: interviewerEmployeeId,
          },
        },
        create: {
          companyId,
          interviewId,
          interviewerId: interviewerEmployeeId,
          overallRating: calculatedRating,
          recommendation: dto.recommendation,
          strengths: dto.strengths,
          concerns: dto.concerns,
          privateNotes: dto.privateNotes,
          sharedFeedback: dto.sharedFeedback,
          isSubmitted: true,
          submittedAt: new Date(),
        },
        update: {
          overallRating: calculatedRating,
          recommendation: dto.recommendation,
          strengths: dto.strengths,
          concerns: dto.concerns,
          privateNotes: dto.privateNotes,
          sharedFeedback: dto.sharedFeedback,
          isSubmitted: true,
          submittedAt: new Date(),
        },
      });

      // 2. Clear old evaluations and write new ones
      await tx.scorecardEvaluation.deleteMany({
        where: { scorecardId: upserted.id },
      });

      if (dto.evaluations && dto.evaluations.length > 0) {
        await tx.scorecardEvaluation.createMany({
          data: dto.evaluations.map((e) => ({
            scorecardId: upserted.id,
            criterionId: e.criterionId,
            rating: Number(e.rating),
            comment: e.comment,
          })),
        });
      }

      return tx.interviewScorecard.findUnique({
        where: { id: upserted.id },
        include: {
          evaluations: { include: { criterion: true } },
          interviewer: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });
    });

    // Log Activity (does NOT complete the interview automatically)
    await this.candidateActivityService.logActivity({
      companyId,
      applicationId: interview.applicationId,
      type: CandidateActivityType.SCORECARD_SUBMITTED,
      title: `Scorecard submitted for ${interview.interviewRound.name}`,
      description: `Rating: ${calculatedRating}/5 • Recommendation: ${dto.recommendation}`,
      performedById: interviewerEmployeeId,
      metadata: {
        interviewId,
        scorecardId: scorecard?.id,
        rating: calculatedRating,
        recommendation: dto.recommendation,
      },
    });

    await this.auditService.logAction(
      companyId,
      interviewerEmployeeId,
      'CREATE',
      'InterviewScorecard',
      scorecard!.id,
      null,
      {
        candidateName: `${interview.application.candidate.firstName} ${interview.application.candidate.lastName}`,
        roundName: interview.interviewRound.name,
        recommendation: dto.recommendation,
        rating: calculatedRating,
      },
    );

    return scorecard;
  }
}
