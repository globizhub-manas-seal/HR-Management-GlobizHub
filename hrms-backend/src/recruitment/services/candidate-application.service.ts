import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SequenceService } from './sequence.service';
import { S3Service } from '../../s3/s3.service';
import { AuditService } from '../../audit/audit.service';
import { SubmitApplicationDto } from '../dto/submit-application.dto';
import { UpdateApplicationStatusDto } from '../dto/update-application-status.dto';

import { CandidateActivityService } from './candidate-activity.service';
import { CandidateActivityType } from '../../../generated/prisma/client';

@Injectable()
export class CandidateApplicationService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private sequenceService: SequenceService,
    private s3Service: S3Service,
    private auditService: AuditService,
    private candidateActivityService: CandidateActivityService,
  ) {}

  /**
   * On startup, ensure all existing companies have a URL-friendly slug and are marked VERIFIED.
   */
  async onModuleInit() {
    try {
      const companies = await this.prisma.company.findMany({
        where: {
          OR: [{ slug: null }, { status: 'PENDING_VERIFICATION' }],
        },
        select: { id: true, name: true, slug: true },
      });

      for (const comp of companies) {
        if (!comp.slug) {
          const generatedSlug =
            comp.name
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '') || `company-${comp.id.slice(0, 6)}`;

          await this.prisma.company
            .update({
              where: { id: comp.id },
              data: {
                slug: generatedSlug,
                status: 'VERIFIED',
              },
            })
            .catch(() => {});
        } else {
          await this.prisma.company
            .update({
              where: { id: comp.id },
              data: { status: 'VERIFIED' },
            })
            .catch(() => {});
        }
      }
    } catch (err) {
      console.warn('Could not auto-migrate company verification slugs:', err);
    }
  }

  // ==========================================
  // PUBLIC MARKETPLACE METHODS (Unauthenticated)
  // ==========================================

  /**
   * 1. Get all published marketplace jobs across verified companies.
   */
  async getPublicMarketplaceJobs(filters?: {
    companySlug?: string;
    departmentId?: string;
    workplaceType?: string;
    search?: string;
  }) {
    const where: any = {
      status: 'PUBLISHED',
      company: {
        status: 'VERIFIED',
      },
    };

    if (filters?.companySlug && filters.companySlug !== 'ALL') {
      where.company.slug = filters.companySlug;
    }

    if (filters?.departmentId && filters.departmentId !== 'ALL') {
      where.departmentId = filters.departmentId;
    }

    if (filters?.workplaceType && filters.workplaceType !== 'ALL') {
      where.workplaceType = filters.workplaceType;
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        {
          company: { name: { contains: filters.search, mode: 'insensitive' } },
        },
      ];
    }

    const jobs = await this.prisma.jobRequisition.findMany({
      where,
      select: {
        id: true,
        jobCode: true,
        title: true,
        location: true,
        workplaceType: true,
        employmentType: true,
        openings: true,
        skills: true,
        showSalaryRange: true,
        salaryMin: true,
        salaryMax: true,
        applicationDeadline: true,
        publishedAt: true,
        department: {
          select: { id: true, name: true },
        },
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            industry: true,
            city: true,
            state: true,
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
    });

    // Sanitize salary if showSalaryRange is false
    return jobs.map((job) => ({
      ...job,
      salaryMin: job.showSalaryRange ? job.salaryMin : null,
      salaryMax: job.showSalaryRange ? job.salaryMax : null,
    }));
  }

  /**
   * 2. List verified companies that currently have published jobs.
   */
  async getPublicCompanies() {
    const companies = await this.prisma.company.findMany({
      where: {
        status: 'VERIFIED',
        jobRequisitions: {
          some: { status: 'PUBLISHED' },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        industry: true,
        city: true,
        state: true,
        website: true,
        _count: {
          select: {
            jobRequisitions: {
              where: { status: 'PUBLISHED' },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return companies.map((c) => ({
      ...c,
      openJobsCount: c._count.jobRequisitions,
    }));
  }

  /**
   * 3. Get company career page details by slug.
   */
  async getPublicCompanyBySlug(companySlug: string) {
    const company = await this.prisma.company.findFirst({
      where: {
        slug: companySlug,
        status: 'VERIFIED',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        industry: true,
        website: true,
        address: true,
        city: true,
        state: true,
        country: true,
        jobRequisitions: {
          where: { status: 'PUBLISHED' },
          select: {
            id: true,
            jobCode: true,
            title: true,
            location: true,
            workplaceType: true,
            employmentType: true,
            openings: true,
            skills: true,
            showSalaryRange: true,
            salaryMin: true,
            salaryMax: true,
            publishedAt: true,
            department: { select: { id: true, name: true } },
          },
          orderBy: { publishedAt: 'desc' },
        },
      },
    });

    if (!company) {
      throw new NotFoundException(
        'Company not found or not verified on Globizhub Careers.',
      );
    }

    // Sanitize salary bounds
    const sanitizedJobs = company.jobRequisitions.map((job) => ({
      ...job,
      salaryMin: job.showSalaryRange ? job.salaryMin : null,
      salaryMax: job.showSalaryRange ? job.salaryMax : null,
    }));

    return {
      ...company,
      jobRequisitions: sanitizedJobs,
    };
  }

  /**
   * 4. Get public job details by companySlug + jobCode.
   */
  async getPublicJobByCode(companySlug: string, jobCode: string) {
    const job = await this.prisma.jobRequisition.findFirst({
      where: {
        jobCode,
        status: 'PUBLISHED',
        company: {
          slug: companySlug,
          status: 'VERIFIED',
        },
      },
      select: {
        id: true,
        jobCode: true,
        title: true,
        location: true,
        workplaceType: true,
        employmentType: true,
        openings: true,
        description: true,
        responsibilities: true,
        requirements: true,
        skills: true,
        screeningQuestions: true,
        showSalaryRange: true,
        salaryMin: true,
        salaryMax: true,
        applicationDeadline: true,
        publishedAt: true,
        department: { select: { id: true, name: true } },
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            industry: true,
            website: true,
            city: true,
            state: true,
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException(
        'Job vacancy not found or no longer published.',
      );
    }

    return {
      ...job,
      salaryMin: job.showSalaryRange ? job.salaryMin : null,
      salaryMax: job.showSalaryRange ? job.salaryMax : null,
    };
  }

  /**
   * 5. Submit Public Candidate Application.
   */
  async submitPublicApplication(
    companySlug: string,
    jobCode: string,
    dto: SubmitApplicationDto,
    resumeFile?: Express.Multer.File,
  ) {
    // 1. Verify Company
    const company = await this.prisma.company.findFirst({
      where: {
        slug: companySlug,
        status: 'VERIFIED',
      },
    });
    if (!company) {
      throw new NotFoundException(
        'Company not found or not eligible to receive applications.',
      );
    }

    // 2. Verify Job
    const job = await this.prisma.jobRequisition.findFirst({
      where: {
        jobCode,
        companyId: company.id,
        status: 'PUBLISHED',
      },
    });
    if (!job) {
      throw new NotFoundException(
        'Job vacancy not found or no longer open for applications.',
      );
    }

    // 3. Validate Mandatory Screening Questions
    const configuredQuestions = (job.screeningQuestions as any[]) || [];
    for (const q of configuredQuestions) {
      if (q.required) {
        const givenAnswer = dto.screeningAnswers?.find(
          (a) => a.questionId === q.id,
        );
        if (
          !givenAnswer ||
          givenAnswer.answer === undefined ||
          givenAnswer.answer === null ||
          givenAnswer.answer === ''
        ) {
          throw new BadRequestException(
            `Answer to question "${q.question}" is required.`,
          );
        }
      }
    }

    // 4. Find or Create Candidate (Scoped to this companyId + email)
    let candidate = await this.prisma.candidate.findUnique({
      where: {
        companyId_email: {
          companyId: company.id,
          email: dto.email.toLowerCase().trim(),
        },
      },
    });

    if (!candidate) {
      candidate = await this.prisma.candidate.create({
        data: {
          companyId: company.id,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          email: dto.email.toLowerCase().trim(),
          phone: dto.phone || null,
          currentCompany: dto.currentCompany || null,
          currentTitle: dto.currentTitle || null,
          totalExperienceYears: dto.totalExperienceYears
            ? Number(dto.totalExperienceYears)
            : null,
          currentLocation: dto.currentLocation || null,
          linkedinUrl: dto.linkedinUrl || null,
          portfolioUrl: dto.portfolioUrl || null,
        },
      });
    } else {
      // Update candidate information with recent details
      candidate = await this.prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          phone: dto.phone || candidate.phone,
          currentCompany: dto.currentCompany || candidate.currentCompany,
          currentTitle: dto.currentTitle || candidate.currentTitle,
          totalExperienceYears:
            dto.totalExperienceYears !== undefined
              ? Number(dto.totalExperienceYears)
              : candidate.totalExperienceYears,
          currentLocation: dto.currentLocation || candidate.currentLocation,
          linkedinUrl: dto.linkedinUrl || candidate.linkedinUrl,
          portfolioUrl: dto.portfolioUrl || candidate.portfolioUrl,
        },
      });
    }

    // 5. Check Duplicate Application for this specific Job
    const existingApplication = await this.prisma.application.findUnique({
      where: {
        jobRequisitionId_candidateId: {
          jobRequisitionId: job.id,
          candidateId: candidate.id,
        },
      },
    });

    if (existingApplication) {
      throw new BadRequestException(
        `You have already applied for this position (${job.title}). Your application reference is ${existingApplication.applicationNumber}.`,
      );
    }

    // 6. Upload Resume if provided
    let uploadedResumeUrl: string | null = null;
    let resumeFileName: string | null = null;

    if (resumeFile) {
      const folderPath = `companies/${company.id}/recruitment/candidates/${candidate.id}/resume`;
      uploadedResumeUrl = await this.s3Service.uploadFile(
        resumeFile,
        folderPath,
      );
      resumeFileName = resumeFile.originalname;

      // Update candidate's default resume
      await this.prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          resumeUrl: uploadedResumeUrl,
          resumeFileName: resumeFileName,
        },
      });
    }

    // 7. Generate Sequential Application Number
    const applicationNumber = await this.sequenceService.getNextSequence(
      company.id,
      'APPLICATION' as any,
      'APP',
    );

    // 8. Create Application
    const application = await this.prisma.application.create({
      data: {
        companyId: company.id,
        jobRequisitionId: job.id,
        candidateId: candidate.id,
        applicationNumber,
        status: 'APPLIED',
        screeningAnswers: (dto.screeningAnswers as any) || [],
        coverLetter: dto.coverLetter || null,
        resumeUrl: uploadedResumeUrl || candidate.resumeUrl,
        source: 'GLOBIZHUB_CAREERS',
      },
    });

    // 9. Audit Event
    await this.auditService.logAction(
      company.id,
      null,
      'CREATE',
      'Application',
      application.id,
      null,
      {
        applicationNumber,
        candidateEmail: candidate.email,
        jobCode: job.jobCode,
        source: 'GLOBIZHUB_CAREERS',
      },
    );

    // 10. Log Activity Trail
    await this.candidateActivityService.logActivity({
      companyId: company.id,
      applicationId: application.id,
      type: CandidateActivityType.APPLICATION_CREATED,
      title: 'Application submitted',
      description: `Candidate submitted application for ${job.title} via Globizhub Careers.`,
      metadata: {
        source: 'GLOBIZHUB_CAREERS',
        applicationNumber,
      },
    });

    return {
      success: true,
      message: 'Your application has been submitted successfully.',
      applicationNumber: application.applicationNumber,
      candidateName: `${candidate.firstName} ${candidate.lastName}`,
      jobTitle: job.title,
    };
  }

  // ==========================================
  // INTERNAL RECRUITER METHODS (Authenticated)
  // ==========================================

  /**
   * 6. List Applications for the logged-in company.
   */
  async getCompanyApplications(
    companyId: string,
    filters?: { jobRequisitionId?: string; status?: string; search?: string },
  ) {
    const where: any = { companyId };

    if (filters?.jobRequisitionId && filters.jobRequisitionId !== 'ALL') {
      where.jobRequisitionId = filters.jobRequisitionId;
    }

    if (filters?.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        {
          applicationNumber: { contains: filters.search, mode: 'insensitive' },
        },
        {
          candidate: {
            firstName: { contains: filters.search, mode: 'insensitive' },
          },
        },
        {
          candidate: {
            lastName: { contains: filters.search, mode: 'insensitive' },
          },
        },
        {
          candidate: {
            email: { contains: filters.search, mode: 'insensitive' },
          },
        },
        {
          jobRequisition: {
            title: { contains: filters.search, mode: 'insensitive' },
          },
        },
      ];
    }

    return this.prisma.application.findMany({
      where,
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            currentCompany: true,
            currentTitle: true,
            totalExperienceYears: true,
            currentLocation: true,
            linkedinUrl: true,
            resumeUrl: true,
            resumeFileName: true,
          },
        },
        jobRequisition: {
          select: {
            id: true,
            jobCode: true,
            title: true,
            department: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 7. Get single application details for recruiter review.
   */
  async getApplicationById(companyId: string, id: string) {
    const application = await this.prisma.application.findFirst({
      where: { id, companyId },
      include: {
        candidate: true,
        jobRequisition: {
          select: {
            id: true,
            jobCode: true,
            title: true,
            location: true,
            department: { select: { id: true, name: true } },
            screeningQuestions: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Candidate application not found');
    }

    return application;
  }

  /**
   * 8. Update Application Status (Phase 2 Lifecycle: APPLIED -> SCREENING -> SHORTLISTED / REJECTED)
   */
  async updateApplicationStatus(
    companyId: string,
    id: string,
    user: any,
    dto: UpdateApplicationStatusDto,
  ) {
    const application = await this.prisma.application.findFirst({
      where: { id, companyId },
      include: { candidate: true, jobRequisition: true },
    });

    if (!application) {
      throw new NotFoundException('Candidate application not found');
    }

    const previousStatus = application.status;

    const updated = await this.prisma.application.update({
      where: { id },
      data: {
        status: dto.status as any,
      },
    });

    await this.auditService.logAction(
      companyId,
      user.sub,
      'UPDATE',
      'Application',
      id,
      { status: previousStatus },
      { status: dto.status, notes: dto.notes },
    );

    // Log Activity Trail
    await this.candidateActivityService.logActivity({
      companyId,
      applicationId: id,
      type: CandidateActivityType.STATUS_CHANGED,
      title: `Application moved to ${dto.status}`,
      description: dto.notes
        ? `Notes: ${dto.notes}`
        : `Status transitioned from ${previousStatus} to ${dto.status}.`,
      performedById: user.sub,
      metadata: {
        previousStatus,
        newStatus: dto.status,
        notes: dto.notes,
      },
    });

    return updated;
  }
}
