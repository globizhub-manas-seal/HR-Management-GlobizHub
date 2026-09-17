import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { CandidateApplicationService } from '../services/candidate-application.service';
import { SubmitApplicationDto } from '../dto/submit-application.dto';

@Controller('recruitment/public/careers')
export class PublicCareerController {
  constructor(private readonly service: CandidateApplicationService) {}

  // 1. Get Marketplace Jobs across verified companies
  @Get('jobs')
  async getMarketplaceJobs(
    @Query('companySlug') companySlug?: string,
    @Query('departmentId') departmentId?: string,
    @Query('workplaceType') workplaceType?: string,
    @Query('search') search?: string,
  ) {
    return this.service.getPublicMarketplaceJobs({
      companySlug,
      departmentId,
      workplaceType,
      search,
    });
  }

  // 2. Get Hiring Companies Directory
  @Get('companies')
  async getCompanies() {
    return this.service.getPublicCompanies();
  }

  // 3. Get Specific Company Career Page
  @Get('companies/:companySlug')
  async getCompanyBySlug(@Param('companySlug') companySlug: string) {
    return this.service.getPublicCompanyBySlug(companySlug);
  }

  // 4. Get Public Job Details by companySlug + jobCode
  @Get(':companySlug/:jobCode')
  async getJobByCode(
    @Param('companySlug') companySlug: string,
    @Param('jobCode') jobCode: string,
  ) {
    return this.service.getPublicJobByCode(companySlug, jobCode);
  }

  // 5. Submit Public Candidate Application with Resume Upload
  @Post(':companySlug/:jobCode/apply')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // Security rate limit: max 10 submissions per minute
  @UseInterceptors(
    FileInterceptor('resume', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
      fileFilter: (_, file, cb) => {
        if (!file.originalname.match(/\.(pdf|doc|docx)$/i)) {
          return cb(
            new BadRequestException(
              'Only PDF, DOC, and DOCX files are allowed for resumes.',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async submitApplication(
    @Param('companySlug') companySlug: string,
    @Param('jobCode') jobCode: string,
    @Body() body: any,
    @UploadedFile() resumeFile?: Express.Multer.File,
  ) {
    // Parse screeningAnswers if submitted as JSON string in multipart/form-data
    let parsedScreeningAnswers = body.screeningAnswers;
    if (typeof parsedScreeningAnswers === 'string') {
      try {
        parsedScreeningAnswers = JSON.parse(parsedScreeningAnswers);
      } catch {
        parsedScreeningAnswers = [];
      }
    }

    const dto: SubmitApplicationDto = {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      currentCompany: body.currentCompany,
      currentTitle: body.currentTitle,
      totalExperienceYears: body.totalExperienceYears
        ? Number(body.totalExperienceYears)
        : undefined,
      currentLocation: body.currentLocation,
      linkedinUrl: body.linkedinUrl,
      portfolioUrl: body.portfolioUrl,
      coverLetter: body.coverLetter,
      screeningAnswers: parsedScreeningAnswers,
    };

    return this.service.submitPublicApplication(
      companySlug,
      jobCode,
      dto,
      resumeFile,
    );
  }
}
