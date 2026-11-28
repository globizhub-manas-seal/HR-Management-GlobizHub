import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { UpdateCaseStatusDto } from './dto/update-case-status.dto';
import { AssignTemplateDto } from './dto/assign-template.dto';

@Controller('onboarding')
@UseGuards(AuthGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  private ensureHrOrAdmin(role: string) {
    if (
      !['SUPER_ADMIN', 'HR_HEAD', 'OWNER', 'ADMIN', 'MANAGER'].includes(role)
    ) {
      throw new ForbiddenException(
        'You do not have permission to manage onboarding cases and templates.',
      );
    }
  }

  // ==========================================
  // EMPLOYEE / CANDIDATE SELF-SERVICE
  // ==========================================

  @Get('me')
  async getMyOnboarding(@Request() req) {
    return this.onboardingService.getMyOnboarding(req.user.sub);
  }

  @Post('me/sign-offer')
  async signOffer(@Request() req) {
    return this.onboardingService.signOffer(req.user.sub);
  }

  @Patch('me/tasks/:taskId')
  async toggleTask(
    @Request() req,
    @Param('taskId') taskId: string,
    @Body() body: { isCompleted?: boolean },
  ) {
    return this.onboardingService.toggleTask(
      req.user.sub,
      taskId,
      body.isCompleted,
    );
  }

  @Post('me/submit')
  async submitForVerification(@Request() req) {
    return this.onboardingService.submitForVerification(req.user.sub);
  }

  // ==========================================
  // TEMPLATES MANAGEMENT (HR / Admin)
  // ==========================================

  @Get('templates')
  async getTemplates(@Request() req) {
    this.ensureHrOrAdmin(req.user.role);
    return this.onboardingService.getTemplates(req.user.companyId);
  }

  @Get('templates/:id')
  async getTemplateById(@Request() req, @Param('id') id: string) {
    this.ensureHrOrAdmin(req.user.role);
    return this.onboardingService.getTemplateById(req.user.companyId, id);
  }

  @Post('templates')
  async createTemplate(@Request() req, @Body() dto: CreateTemplateDto) {
    this.ensureHrOrAdmin(req.user.role);
    return this.onboardingService.createTemplate(
      req.user.companyId,
      dto,
      req.user.sub,
    );
  }

  @Patch('templates/:id')
  async updateTemplate(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    this.ensureHrOrAdmin(req.user.role);
    return this.onboardingService.updateTemplate(
      req.user.companyId,
      id,
      dto,
      req.user.sub,
    );
  }

  @Delete('templates/:id')
  async deleteTemplate(@Request() req, @Param('id') id: string) {
    this.ensureHrOrAdmin(req.user.role);
    return this.onboardingService.deleteTemplate(
      req.user.companyId,
      id,
      req.user.sub,
    );
  }

  // ==========================================
  // ONBOARDING CASES MANAGEMENT (HR / Admin)
  // ==========================================

  @Get('cases')
  async getAllCases(@Request() req, @Query('status') status?: string) {
    this.ensureHrOrAdmin(req.user.role);
    return this.onboardingService.getAllCases(req.user.companyId, status);
  }

  @Get('cases/:id')
  async getCaseById(@Request() req, @Param('id') id: string) {
    this.ensureHrOrAdmin(req.user.role);
    return this.onboardingService.getCaseById(req.user.companyId, id);
  }

  @Patch('cases/:id/status')
  async updateCaseStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateCaseStatusDto,
  ) {
    this.ensureHrOrAdmin(req.user.role);
    return this.onboardingService.updateCaseStatus(
      req.user.companyId,
      id,
      dto,
      req.user.sub,
    );
  }

  @Post('cases/:id/assign-template')
  async assignTemplate(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: AssignTemplateDto,
  ) {
    this.ensureHrOrAdmin(req.user.role);
    return this.onboardingService.assignTemplateToEmployee(
      req.user.companyId,
      id,
      dto.templateId,
      req.user.sub,
    );
  }
}
