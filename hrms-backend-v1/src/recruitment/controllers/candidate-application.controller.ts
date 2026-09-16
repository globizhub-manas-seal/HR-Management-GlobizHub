import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import { CandidateApplicationService } from '../services/candidate-application.service';
import { CandidateConversionService } from '../services/candidate-conversion.service';
import { UpdateApplicationStatusDto } from '../dto/update-application-status.dto';
import { ConvertCandidateDto } from '../dto/convert-candidate.dto';

@Controller('recruitment/applications')
@UseGuards(AuthGuard)
export class CandidateApplicationController {
  constructor(
    private readonly service: CandidateApplicationService,
    private readonly conversionService: CandidateConversionService,
  ) {}

  // 1. List Applications for the authenticated company
  @Get()
  async findAll(
    @Request() req,
    @Query('jobRequisitionId') jobRequisitionId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.service.getCompanyApplications(req.user.companyId, {
      jobRequisitionId,
      status,
      search,
    });
  }

  // 2. Get Single Application Details with Screening Answers & Resume Link
  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.service.getApplicationById(req.user.companyId, id);
  }

  // 3. Update Candidate Application Stage (APPLIED -> SCREENING -> SHORTLISTED / REJECTED)
  @Patch(':id/status')
  async updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.service.updateApplicationStatus(
      req.user.companyId,
      id,
      req.user,
      dto,
    );
  }

  // 4. Convert Candidate with Accepted Offer into Employee
  @Post(':id/convert')
  async convertCandidate(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: ConvertCandidateDto,
  ) {
    if (
      !['SUPER_ADMIN', 'HR_HEAD', 'OWNER', 'MANAGER'].includes(req.user.role)
    ) {
      throw new ForbiddenException(
        'Only HR, Admins or Managers can onboard candidates as employees.',
      );
    }
    return this.conversionService.convertCandidateToEmployee(
      id,
      req.user.companyId,
      req.user.sub || req.user.id,
      dto,
    );
  }
}
