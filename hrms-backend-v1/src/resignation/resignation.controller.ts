import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ResignationService } from './resignation.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateResignationDto } from './dto/create-resignation.dto';
import { ReviewResignationDto } from './dto/review-resignation.dto';
import { UpdateClearanceDto } from './dto/update-clearance.dto';
import { FinalizeResignationDto } from './dto/finalize-resignation.dto';

@Controller('resignation')
@UseGuards(AuthGuard)
export class ResignationController {
  constructor(private readonly resignationService: ResignationService) {}

  // 1. Submit Resignation
  @Post('apply')
  async apply(@Request() req, @Body() dto: CreateResignationDto) {
    return this.resignationService.applyResignation(
      req.user.sub,
      req.user.companyId,
      dto,
    );
  }

  // 2. Get my resignations & active notice status
  @Get('my')
  async getMyResignations(@Request() req) {
    return this.resignationService.getMyResignations(
      req.user.sub,
      req.user.companyId,
    );
  }

  // 3. Withdraw resignation
  @Post(':id/withdraw')
  async withdraw(@Request() req, @Param('id') id: string) {
    return this.resignationService.withdrawResignation(req.user.sub, id);
  }

  // 4. Company overview list for Managers & HR
  @Get('company')
  async getCompanyResignations(
    @Request() req,
    @Query('status') status?: string,
  ) {
    return this.resignationService.getCompanyResignations(
      req.user.companyId,
      req.user,
      status,
    );
  }

  // 5. Dashboard statistics for HR/Managers
  @Get('stats')
  async getStats(@Request() req) {
    return this.resignationService.getResignationStats(
      req.user.companyId,
      req.user,
    );
  }

  // 6. Manager review
  @Patch(':id/manager-review')
  async reviewByManager(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: ReviewResignationDto,
  ) {
    return this.resignationService.reviewByManager(
      req.user.sub,
      req.user.companyId,
      id,
      dto,
    );
  }

  // 7. HR review & approval
  @Patch(':id/hr-review')
  async reviewByHr(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: ReviewResignationDto,
  ) {
    return this.resignationService.reviewByHr(
      req.user.sub,
      req.user.companyId,
      id,
      dto,
    );
  }

  // 8. Update Department Clearance Item
  @Patch(':id/clearance')
  async updateClearance(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateClearanceDto,
  ) {
    return this.resignationService.updateClearance(
      req.user.sub,
      req.user.companyId,
      id,
      dto,
    );
  }

  // 9. Finalize Offboarding & Separation
  @Post(':id/finalize')
  async finalize(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: FinalizeResignationDto,
  ) {
    return this.resignationService.finalizeOffboarding(
      req.user.sub,
      req.user.companyId,
      id,
      dto,
    );
  }
}
