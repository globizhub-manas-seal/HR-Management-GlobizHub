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
import { ManpowerRequisitionService } from '../services/manpower-requisition.service';
import { CreateManpowerRequisitionDto } from '../dto/create-manpower-requisition.dto';
import { UpdateManpowerRequisitionDto } from '../dto/update-manpower-requisition.dto';
import {
  ApproveRequisitionDto,
  RequestChangesDto,
  RejectRequisitionDto,
} from '../dto/review-manpower-requisition.dto';

@Controller('recruitment/manpower')
@UseGuards(AuthGuard)
export class ManpowerRequisitionController {
  constructor(private readonly service: ManpowerRequisitionService) {}

  // 1. Create Draft Manpower Requisition
  @Post()
  async create(@Request() req, @Body() dto: CreateManpowerRequisitionDto) {
    return this.service.createRequisition(req.user.companyId, req.user, dto);
  }

  // 2. Dashboard KPIs
  @Get('stats')
  async getStats(@Request() req) {
    return this.service.getDashboardStats(req.user.companyId);
  }

  // 3. List Requisitions
  @Get()
  async findAll(
    @Request() req,
    @Query('status') status?: string,
    @Query('departmentId') departmentId?: string,
    @Query('search') search?: string,
  ) {
    return this.service.getRequisitions(req.user.companyId, req.user, {
      status,
      departmentId,
      search,
    });
  }

  // 4. Get Requisition Detail & History
  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.service.getRequisitionById(req.user.companyId, id);
  }

  // 5. Update Requisition (DRAFT or CHANGES_REQUESTED)
  @Patch(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateManpowerRequisitionDto,
  ) {
    return this.service.updateRequisition(
      req.user.companyId,
      id,
      req.user,
      dto,
    );
  }

  // 6. Submit for Review
  @Post(':id/submit')
  async submit(@Request() req, @Param('id') id: string) {
    return this.service.submitRequisition(req.user.companyId, id, req.user);
  }

  // 7. Start Review (HR/Admin)
  @Post(':id/start-review')
  async startReview(@Request() req, @Param('id') id: string) {
    return this.service.startReview(req.user.companyId, id, req.user);
  }

  // 8. Request Changes (HR/Admin from UNDER_REVIEW)
  @Post(':id/request-changes')
  async requestChanges(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: RequestChangesDto,
  ) {
    return this.service.requestChanges(req.user.companyId, id, req.user, dto);
  }

  // 9. Approve Requisition (HR/Admin from UNDER_REVIEW)
  @Post(':id/approve')
  async approve(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: ApproveRequisitionDto,
  ) {
    return this.service.approveRequisition(
      req.user.companyId,
      id,
      req.user,
      dto,
    );
  }

  // 10. Reject Requisition (HR/Admin from UNDER_REVIEW)
  @Post(':id/reject')
  async reject(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: RejectRequisitionDto,
  ) {
    return this.service.rejectRequisition(
      req.user.companyId,
      id,
      req.user,
      dto,
    );
  }

  // 11. Cancel Requisition
  @Post(':id/cancel')
  async cancel(
    @Request() req,
    @Param('id') id: string,
    @Body('comments') comments?: string,
  ) {
    return this.service.cancelRequisition(
      req.user.companyId,
      id,
      req.user,
      comments,
    );
  }
}
