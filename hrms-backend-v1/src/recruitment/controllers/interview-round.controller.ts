import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import { InterviewRoundService } from '../services/interview-round.service';
import {
  CreateInterviewRoundDto,
  UpdateInterviewRoundDto,
} from '../dto/interview-round.dto';

@Controller('recruitment')
@UseGuards(AuthGuard)
export class InterviewRoundController {
  constructor(private readonly service: InterviewRoundService) {}

  @Get('jobs/:jobId/interview-rounds')
  async getRoundsForJob(@Request() req, @Param('jobId') jobId: string) {
    return this.service.getRoundsForJob(jobId, req.user.companyId);
  }

  @Post('jobs/:jobId/interview-rounds')
  async createRound(
    @Request() req,
    @Param('jobId') jobId: string,
    @Body() dto: CreateInterviewRoundDto,
  ) {
    return this.service.createRound(jobId, req.user.companyId, dto);
  }

  @Post('jobs/:jobId/interview-rounds/default')
  async seedDefaultRounds(@Request() req, @Param('jobId') jobId: string) {
    return this.service.seedDefaultRounds(jobId, req.user.companyId);
  }

  @Patch('interview-rounds/:id')
  async updateRound(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateInterviewRoundDto,
  ) {
    return this.service.updateRound(id, req.user.companyId, dto);
  }

  @Delete('interview-rounds/:id')
  async deleteRound(@Request() req, @Param('id') id: string) {
    return this.service.deactivateOrDeleteRound(id, req.user.companyId);
  }
}
