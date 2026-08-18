import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AnnouncementService } from './announcement.service';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@Controller('announcements')
@UseGuards(AuthGuard, PermissionsGuard)
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Post()
  @RequirePermissions('announcement.manage') // Admins/HR
  async create(@Request() req, @Body() body: { title: string; content: string }) {
    return this.announcementService.createAnnouncement(
      req.user.companyId,
      body.title,
      body.content,
    );
  }

  @Get()
  async findAll(@Request() req) {
    return this.announcementService.getAnnouncements(req.user.companyId);
  }

  @Delete(':id')
  @RequirePermissions('announcement.manage') // Admins/HR
  async remove(@Request() req, @Param('id') id: string) {
    return this.announcementService.deleteAnnouncement(req.user.companyId, id);
  }
}
