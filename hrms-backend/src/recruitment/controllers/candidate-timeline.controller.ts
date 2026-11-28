import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import { CandidateActivityService } from '../services/candidate-activity.service';
import { CandidateDecisionDto } from '../dto/candidate-decision.dto';

@Controller('recruitment')
@UseGuards(AuthGuard)
export class CandidateTimelineController {
  constructor(private readonly service: CandidateActivityService) {}

  @Get('applications/:applicationId/timeline')
  async getTimeline(
    @Request() req,
    @Param('applicationId') applicationId: string,
  ) {
    return this.service.getTimeline(applicationId, req.user.companyId);
  }

  @Post('applications/:applicationId/decision')
  async makeCandidateDecision(
    @Request() req,
    @Param('applicationId') applicationId: string,
    @Body() dto: CandidateDecisionDto,
  ) {
    return this.service.makeCandidateDecision(
      applicationId,
      req.user.companyId,
      req.user.sub,
      dto,
    );
  }
}
