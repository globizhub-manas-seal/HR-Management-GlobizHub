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
import { ScorecardService } from '../services/scorecard.service';
import { SubmitScorecardDto } from '../dto/submit-scorecard.dto';

@Controller('recruitment')
@UseGuards(AuthGuard)
export class ScorecardController {
  constructor(private readonly service: ScorecardService) {}

  @Get('interviews/:id/scorecards')
  async getScorecardsForInterview(
    @Request() req,
    @Param('id') interviewId: string,
  ) {
    const isHrOrAdmin = ['SUPER_ADMIN', 'OWNER', 'HR_HEAD'].includes(
      req.user.role,
    );
    return this.service.getScorecardsForInterview(
      interviewId,
      req.user.companyId,
      req.user.sub,
      isHrOrAdmin,
    );
  }

  @Post('interviews/:id/scorecards')
  async submitScorecard(
    @Request() req,
    @Param('id') interviewId: string,
    @Body() dto: SubmitScorecardDto,
  ) {
    return this.service.submitScorecard(
      interviewId,
      req.user.sub,
      req.user.companyId,
      dto,
    );
  }
}
