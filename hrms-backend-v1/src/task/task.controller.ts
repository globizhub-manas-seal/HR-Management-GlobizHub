import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@Controller('tasks')
@UseGuards(AuthGuard, PermissionsGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @RequirePermissions('task.manage') // Admins/Managers
  async create(
    @Request() req,
    @Body()
    body: {
      employeeId: string;
      title: string;
      description?: string;
      dueDate?: string;
    },
  ) {
    return this.taskService.createTask(
      req.user.companyId,
      body.employeeId,
      body.title,
      body.description,
      body.dueDate,
    );
  }

  @Get('me')
  async findMyTasks(@Request() req) {
    return this.taskService.getMyTasks(req.user.sub);
  }

  @Patch(':id/status')
  async updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.taskService.updateTaskStatus(req.user.sub, id, body.status);
  }

  @Get()
  @RequirePermissions('task.manage') // Admins/Managers
  async findAll(@Request() req) {
    return this.taskService.getCompanyTasks(req.user.companyId);
  }

  @Delete(':id')
  @RequirePermissions('task.manage') // Admins/Managers
  async remove(@Request() req, @Param('id') id: string) {
    return this.taskService.deleteTask(req.user.companyId, id);
  }
}
