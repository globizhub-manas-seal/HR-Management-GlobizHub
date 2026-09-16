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
} from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import { JobRequisitionService } from '../services/job-requisition.service';
import { CreateJobRequisitionDto } from '../dto/create-job-requisition.dto';
import { UpdateJobRequisitionDto } from '../dto/update-job-requisition.dto';

@Controller('recruitment/jobs')
@UseGuards(AuthGuard)
export class JobRequisitionController {
  constructor(private readonly service: JobRequisitionService) {}

  // 1. Create Job from Approved Manpower Requisition (Normal Path)
  @Post('from-manpower')
  async createFromManpower(
    @Request() req,
    @Body() dto: CreateJobRequisitionDto,
  ) {
    return this.service.createFromManpowerRequisition(
      req.user.companyId,
      req.user,
      dto,
    );
  }

  // 2. Create Direct Job (Role-Gated Exception Path)
  @Post('direct')
  async createDirect(@Request() req, @Body() dto: CreateJobRequisitionDto) {
    return this.service.createDirectJob(req.user.companyId, req.user, dto);
  }

  // 3. List Jobs
  @Get()
  async findAll(
    @Request() req,
    @Query('status') status?: string,
    @Query('departmentId') departmentId?: string,
    @Query('search') search?: string,
  ) {
    return this.service.getJobs(req.user.companyId, {
      status,
      departmentId,
      search,
    });
  }

  // 4. Get Single Job Detail
  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.service.getJobById(req.user.companyId, id);
  }

  // 5. Update Job Details (DRAFT or PENDING_APPROVAL)
  @Patch(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateJobRequisitionDto,
  ) {
    return this.service.updateJob(req.user.companyId, id, req.user, dto);
  }

  // 6. Submit Job for Approval (DRAFT -> PENDING_APPROVAL)
  @Post(':id/submit')
  async submit(@Request() req, @Param('id') id: string) {
    return this.service.submitForApproval(req.user.companyId, id, req.user);
  }

  // 7. Approve Job (PENDING_APPROVAL -> APPROVED)
  @Post(':id/approve')
  async approve(@Request() req, @Param('id') id: string) {
    return this.service.approveJob(req.user.companyId, id, req.user);
  }

  // 8. Publish Job (APPROVED -> PUBLISHED)
  @Post(':id/publish')
  async publish(@Request() req, @Param('id') id: string) {
    return this.service.publishJob(req.user.companyId, id, req.user);
  }

  // 9. Pause Job (PUBLISHED -> PAUSED)
  @Post(':id/pause')
  async pause(@Request() req, @Param('id') id: string) {
    return this.service.pauseJob(req.user.companyId, id, req.user);
  }

  // 10. Resume Job (PAUSED -> PUBLISHED)
  @Post(':id/resume')
  async resume(@Request() req, @Param('id') id: string) {
    return this.service.resumeJob(req.user.companyId, id, req.user);
  }

  // 11. Close Job (PUBLISHED/PAUSED -> CLOSED)
  @Post(':id/close')
  async close(@Request() req, @Param('id') id: string) {
    return this.service.closeJob(req.user.companyId, id, req.user);
  }
}
