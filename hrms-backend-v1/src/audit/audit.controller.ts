import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@Controller('audit')
@UseGuards(AuthGuard, PermissionsGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermissions('system.audit') // STRICT: Only high-level admins can see this
  async getAuditLogs(@Request() req, @Query('limit') limit: string) {
    const take = limit ? parseInt(limit, 10) : 50;
    return this.auditService.getLogs(req.user.companyId, take);
  }
}
