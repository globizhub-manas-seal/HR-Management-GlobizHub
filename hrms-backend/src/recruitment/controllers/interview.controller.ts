import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import { InterviewService } from '../services/interview.service';
import {
  ScheduleInterviewDto,
  RescheduleInterviewDto,
  UpdateInterviewStatusDto,
} from '../dto/schedule-interview.dto';

@Controller('recruitment')
@UseGuards(AuthGuard)
export class InterviewController {
  constructor(private readonly service: InterviewService) {}

  @Post('applications/:applicationId/interviews')
  async scheduleInterview(
    @Request() req,
    @Param('applicationId') applicationId: string,
    @Body() dto: ScheduleInterviewDto,
  ) {
    return this.service.scheduleInterview(
      applicationId,
      req.user.companyId,
      req.user.sub,
      dto,
    );
  }

  @Get('applications/:applicationId/interviews')
  async getInterviewsForApplication(
    @Request() req,
    @Param('applicationId') applicationId: string,
  ) {
    return this.service.getInterviewsForApplication(
      applicationId,
      req.user.companyId,
    );
  }

  @Get('interviews/:id')
  async getInterviewById(@Request() req, @Param('id') id: string) {
    return this.service.getInterviewById(id, req.user.companyId);
  }

  @Post('interviews/:id/reschedule')
  async rescheduleInterview(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: RescheduleInterviewDto,
  ) {
    return this.service.rescheduleInterview(
      id,
      req.user.companyId,
      req.user.sub,
      dto,
    );
  }

  @Post('interviews/:id/cancel')
  async cancelInterview(
    @Request() req,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.service.cancelInterview(
      id,
      req.user.companyId,
      req.user.sub,
      reason,
    );
  }

  @Patch('interviews/:id/status')
  async updateInterviewStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateInterviewStatusDto,
  ) {
    return this.service.updateInterviewStatus(
      id,
      req.user.companyId,
      req.user.sub,
      dto,
    );
  }
}
