import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateInterviewRoundDto,
  UpdateInterviewRoundDto,
} from '../dto/interview-round.dto';
import { InterviewRoundType } from '../../../generated/prisma/client';

@Injectable()
export class InterviewRoundService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all interview rounds for a job requisition, ordered by sequence
   */
  async getRoundsForJob(jobId: string, companyId: string) {
    const job = await this.prisma.jobRequisition.findFirst({
      where: { id: jobId, companyId },
    });

    if (!job) {
      throw new NotFoundException('Job requisition not found');
    }

    return this.prisma.interviewRound.findMany({
      where: { jobRequisitionId: jobId, companyId },
      include: {
        criteria: {
          orderBy: { sequence: 'asc' },
        },
        _count: {
          select: { interviews: true },
        },
      },
      orderBy: { sequence: 'asc' },
    });
  }

  /**
   * Create an interview round for a job
   */
  async createRound(
    jobId: string,
    companyId: string,
    dto: CreateInterviewRoundDto,
  ) {
    const job = await this.prisma.jobRequisition.findFirst({
      where: { id: jobId, companyId },
    });

    if (!job) {
      throw new NotFoundException('Job requisition not found');
    }

    const existingRoundsCount = await this.prisma.interviewRound.count({
      where: { jobRequisitionId: jobId, companyId },
    });

    const sequence = dto.sequence ?? existingRoundsCount + 1;

    return this.prisma.interviewRound.create({
      data: {
        companyId,
        jobRequisitionId: jobId,
        name: dto.name,
        type: dto.type,
        sequence,
        durationMinutes: dto.durationMinutes ?? 60,
        isRequired: dto.isRequired ?? true,
        isActive: true,
        description: dto.description,
        criteria:
          dto.criteria && dto.criteria.length > 0
            ? {
                create: dto.criteria.map((c, index) => ({
                  name: c.name,
                  description: c.description,
                  weight: c.weight ?? 1.0,
                  maxRating: c.maxRating ?? 5,
                  sequence: c.sequence ?? index + 1,
                })),
              }
            : undefined,
      },
      include: {
        criteria: {
          orderBy: { sequence: 'asc' },
        },
      },
    });
  }

  /**
   * Update an interview round and its criteria
   */
  async updateRound(
    roundId: string,
    companyId: string,
    dto: UpdateInterviewRoundDto,
  ) {
    const round = await this.prisma.interviewRound.findFirst({
      where: { id: roundId, companyId },
      include: { criteria: true },
    });

    if (!round) {
      throw new NotFoundException('Interview round not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // If criteria array provided, replace criteria
      if (dto.criteria) {
        await tx.scorecardCriterion.deleteMany({
          where: { interviewRoundId: roundId },
        });

        if (dto.criteria.length > 0) {
          await tx.scorecardCriterion.createMany({
            data: dto.criteria.map((c, index) => ({
              interviewRoundId: roundId,
              name: c.name,
              description: c.description,
              weight: c.weight ?? 1.0,
              maxRating: c.maxRating ?? 5,
              sequence: c.sequence ?? index + 1,
            })),
          });
        }
      }

      return tx.interviewRound.update({
        where: { id: roundId },
        data: {
          name: dto.name,
          type: dto.type,
          sequence: dto.sequence,
          durationMinutes: dto.durationMinutes,
          isRequired: dto.isRequired,
          isActive: dto.isActive,
          description: dto.description,
        },
        include: {
          criteria: {
            orderBy: { sequence: 'asc' },
          },
        },
      });
    });
  }

  /**
   * Soft-deactivate if historical interviews exist; otherwise delete
   */
  async deactivateOrDeleteRound(roundId: string, companyId: string) {
    const round = await this.prisma.interviewRound.findFirst({
      where: { id: roundId, companyId },
    });

    if (!round) {
      throw new NotFoundException('Interview round not found');
    }

    const interviewsCount = await this.prisma.interview.count({
      where: { interviewRoundId: roundId },
    });

    if (interviewsCount > 0) {
      // Historical interviews exist: soft archive
      const updated = await this.prisma.interviewRound.update({
        where: { id: roundId },
        data: { isActive: false },
      });
      return {
        success: true,
        archived: true,
        message:
          'Round has historical interview records and was archived (set to inactive) rather than deleted.',
        round: updated,
      };
    }

    // No interviews conducted yet: safe to physically delete
    await this.prisma.interviewRound.delete({
      where: { id: roundId },
    });

    return {
      success: true,
      archived: false,
      message: 'Interview round deleted successfully.',
    };
  }

  /**
   * Seed standard interview pipeline template for a job
   */
  async seedDefaultRounds(jobId: string, companyId: string) {
    const existing = await this.prisma.interviewRound.findMany({
      where: { jobRequisitionId: jobId, companyId },
      include: { criteria: true },
    });

    if (existing.length > 0) {
      return existing;
    }

    const defaultPipeline = [
      {
        name: 'Recruiter Screening',
        type: InterviewRoundType.HR,
        sequence: 1,
        durationMinutes: 30,
        isRequired: true,
        description:
          'Initial recruiter assessment on role fit, communication, and basic qualifications.',
        criteria: [
          {
            name: 'Communication & Articulation',
            weight: 1.0,
            maxRating: 5,
            sequence: 1,
          },
          {
            name: 'Role Interest & Motivation',
            weight: 1.0,
            maxRating: 5,
            sequence: 2,
          },
          {
            name: 'Cultural Alignment & Professionalism',
            weight: 1.0,
            maxRating: 5,
            sequence: 3,
          },
        ],
      },
      {
        name: 'Technical Assessment & Problem Solving',
        type: InterviewRoundType.TECHNICAL,
        sequence: 2,
        durationMinutes: 60,
        isRequired: true,
        description:
          'In-depth assessment of core technical capabilities, code quality, and system design.',
        criteria: [
          {
            name: 'Core Technical Competency',
            weight: 1.2,
            maxRating: 5,
            sequence: 1,
          },
          {
            name: 'Problem Solving & Logic',
            weight: 1.2,
            maxRating: 5,
            sequence: 2,
          },
          {
            name: 'System Architecture & Scalability',
            weight: 1.0,
            maxRating: 5,
            sequence: 3,
          },
          {
            name: 'Code Quality & Best Practices',
            weight: 1.0,
            maxRating: 5,
            sequence: 4,
          },
        ],
      },
      {
        name: 'Hiring Manager Discussion',
        type: InterviewRoundType.MANAGER,
        sequence: 3,
        durationMinutes: 45,
        isRequired: true,
        description:
          'Discussion on team fit, past execution, ownership, and cross-functional leadership.',
        criteria: [
          {
            name: 'Project Ownership & Execution',
            weight: 1.0,
            maxRating: 5,
            sequence: 1,
          },
          {
            name: 'Team Collaboration & Mentorship',
            weight: 1.0,
            maxRating: 5,
            sequence: 2,
          },
          {
            name: 'Adaptability & Problem Handling',
            weight: 1.0,
            maxRating: 5,
            sequence: 3,
          },
        ],
      },
    ];

    const createdRounds: any[] = [];
    for (const roundData of defaultPipeline) {
      const created = await this.prisma.interviewRound.create({
        data: {
          companyId,
          jobRequisitionId: jobId,
          name: roundData.name,
          type: roundData.type,
          sequence: roundData.sequence,
          durationMinutes: roundData.durationMinutes,
          isRequired: roundData.isRequired,
          isActive: true,
          description: roundData.description,
          criteria: {
            create: roundData.criteria,
          },
        },
        include: { criteria: true },
      });
      createdRounds.push(created);
    }

    return createdRounds;
  }
}
