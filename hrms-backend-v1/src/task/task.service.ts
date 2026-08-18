import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

  async createTask(
    companyId: string,
    employeeId: string,
    title: string,
    description?: string,
    dueDate?: string,
  ) {
    // Verify target employee belongs to the same company
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, companyId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found in this company');
    }

    return this.prisma.task.create({
      data: {
        companyId,
        employeeId,
        title,
        description,
        status: 'PENDING',
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });
  }

  async getMyTasks(employeeId: string) {
    return this.prisma.task.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateTaskStatus(employeeId: string, taskId: string, status: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.employeeId !== employeeId) {
      throw new ForbiddenException('You cannot update status of a task not assigned to you');
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data: { status },
    });
  }

  async getCompanyTasks(companyId: string) {
    return this.prisma.task.findMany({
      where: { companyId },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteTask(companyId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, companyId },
    });

    if (!task) {
      throw new NotFoundException('Task not found in this company');
    }

    return this.prisma.task.delete({
      where: { id: taskId },
    });
  }
}
